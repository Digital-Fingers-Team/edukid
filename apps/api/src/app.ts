import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import type { Db } from './db.ts';
import { authRoutes, requireParent } from './auth.ts';
import { childrenRoutes } from './children.ts';
import { progressRoutes } from './progress.ts';
import { recordingRoutes } from './recordings.ts';
import { accountRoutes } from './account.ts';
import { webRoutes } from './web.ts';

export interface AppOptions {
  db: Db; dataDir: string; cookieSecure: boolean; logger?: boolean;
  /** Built web app to serve (production). */ webDir?: string;
  /** Book PDFs served at /books/. */ booksDir?: string;
}

export async function buildApp(o: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: o.logger ?? false, bodyLimit: 1_000_000, trustProxy: '127.0.0.1' /* only the local nginx; its X-Forwarded-For entry is the real client */ });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 } });
  app.decorateRequest('parentId', '');
  app.get('/api/health', async () => ({ ok: true }));
  await app.register(authRoutes, o);
  await app.register(async (scoped) => {
    scoped.addHook('preHandler', requireParent(o.db));
    await scoped.register(childrenRoutes, o);
    await scoped.register(progressRoutes, o);
    await scoped.register(recordingRoutes, o);
    await scoped.register(accountRoutes, o);
  });
  await app.register(webRoutes, { webDir: o.webDir, booksDir: o.booksDir });
  return app;
}
