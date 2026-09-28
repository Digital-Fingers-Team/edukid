import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { Child } from '../../../shared/types.ts';
import { openDb } from '../src/db.ts';
import { buildApp } from '../src/app.ts';

export async function makeApp() {
  const dataDir = await mkdtemp(join(tmpdir(), 'edukid-'));
  const db = openDb(':memory:');
  const app = await buildApp({ db, dataDir, cookieSecure: false });
  return { app, db, dataDir };
}

export async function signup(app: FastifyInstance, email = 'parent@example.com', password = 'secret123') {
  const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, password } });
  if (res.statusCode !== 201) throw new Error(`signup failed: ${res.statusCode} ${res.body}`);
  const sid = res.cookies.find((c) => c.name === 'sid')!.value;
  return { headers: { cookie: `sid=${sid}` }, me: res.json() as { id: string; email: string } };
}

export async function addChild(app: FastifyInstance, headers: { cookie: string }, name = 'نور') {
  const res = await app.inject({ method: 'POST', url: '/api/children', headers,
    payload: { name, kg: 1, avatar: '1F981', stageSince: '2026-09-24' } });
  if (res.statusCode !== 201) throw new Error(`addChild failed: ${res.statusCode} ${res.body}`);
  return res.json() as Child;
}

export function multipart(fields: Record<string, string>, file: { name: string; filename: string; type: string; data: Buffer }) {
  const boundary = `----edukid${Math.random().toString(16).slice(2)}`;
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`));
  parts.push(file.data, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}
