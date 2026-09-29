import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';

/** Serves the built web app (SPA) and the book PDFs, so one upstream port covers the whole site. */
export async function webRoutes(app: FastifyInstance, o: { webDir?: string; booksDir?: string }) {
  if (o.booksDir) {
    await app.register(fastifyStatic, {
      root: o.booksDir, prefix: '/books/', decorateReply: false, index: false,
      setHeaders: (res) => res.header('cache-control', 'public, max-age=604800'),
    });
  }
  if (!o.webDir) return;
  await app.register(fastifyStatic, {
    root: o.webDir, prefix: '/', wildcard: true, index: false, // wildcard: a rebuild is served without a restart
    setHeaders: (res, path) => {
      const hashed = /[\\/]assets[\\/]/.test(path);
      res.header('cache-control', hashed ? 'public, max-age=2592000, immutable' : 'no-cache');
    },
  });
  app.get('/', (_req, reply) => reply.header('cache-control', 'no-cache').sendFile('index.html'));
  app.setNotFoundHandler((req, reply) => {
    const path = req.url.split('?')[0]!;
    // Only client routes fall back to the app; a missing file (e.g. an old hashed bundle) must stay a 404.
    if (req.method !== 'GET' || path.startsWith('/api/') || path.startsWith('/books/') || /\.[a-z0-9]+$/i.test(path)) {
      return reply.code(404).send({ error: 'not_found' });
    }
    return reply.header('cache-control', 'no-cache').sendFile('index.html');
  });
}
