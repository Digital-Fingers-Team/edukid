import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from './db.ts';
import type { AppOptions } from './app.ts';

declare module 'fastify' {
  interface FastifyRequest { parentId: string }
}

function scrypt(pw: string, salt: Buffer, len: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(pw.normalize('NFKC'), salt, len, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(key, expected);
}

const SESSION_DAYS = 180;
const DAY_MS = 86_400_000;

const credentials = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', maxLength: 200, pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' },
    password: { type: 'string', minLength: 8, maxLength: 200 },
  },
} as const;

export function requireParent(db: Db) {
  const find = db.prepare('SELECT parent_id FROM auth_sessions WHERE id = ? AND expires_at > ?');
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const sid = req.cookies.sid;
    const row = sid ? (find.get(sid, Date.now()) as { parent_id: string } | undefined) : undefined;
    if (!row) return reply.code(401).send({ error: 'unauthorized' });
    req.parentId = row.parent_id;
  };
}

export async function authRoutes(app: FastifyInstance, o: AppOptions) {
  const { db } = o;
  const limited = { rateLimit: { max: 10, timeWindow: '1 minute' } };

  function startSession(reply: FastifyReply, parentId: string) {
    const id = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO auth_sessions (id, parent_id, expires_at) VALUES (?, ?, ?)')
      .run(id, parentId, Date.now() + SESSION_DAYS * DAY_MS);
    reply.setCookie('sid', id, {
      httpOnly: true, secure: o.cookieSecure, sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86_400,
    });
  }

  app.post('/api/auth/register', { schema: { body: credentials }, config: limited }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    const norm = email.toLowerCase();
    if (db.prepare('SELECT 1 FROM parents WHERE email = ?').get(norm)) {
      return reply.code(409).send({ error: 'email_taken' });
    }
    const id = randomUUID();
    db.prepare('INSERT INTO parents (id, email, pass_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(id, norm, await hashPassword(password), Date.now());
    startSession(reply, id);
    return reply.code(201).send({ id, email: norm });
  });

  app.post('/api/auth/login', { schema: { body: credentials }, config: limited }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    const row = db.prepare('SELECT id, email, pass_hash FROM parents WHERE email = ?').get(email.toLowerCase()) as
      | { id: string; email: string; pass_hash: string } | undefined;
    if (!row || !(await verifyPassword(password, row.pass_hash))) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }
    startSession(reply, row.id);
    return { id: row.id, email: row.email };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    if (req.cookies.sid) db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(req.cookies.sid);
    reply.clearCookie('sid', { path: '/' });
    return reply.code(204).send();
  });

  app.get('/api/me', { preHandler: requireParent(db) }, async (req) => {
    return db.prepare('SELECT id, email FROM parents WHERE id = ?').get(req.parentId);
  });
}
