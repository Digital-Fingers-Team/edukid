import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import type { Db } from './db.ts';

export interface AppOptions { db: Db; dataDir: string; cookieSecure: boolean; logger?: boolean }

export async function buildApp(o: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: o.logger ?? false, bodyLimit: 1_000_000, trustProxy: true });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 } });
  app.get('/api/health', async () => ({ ok: true }));
  return app;
}
