import type { FastifyInstance } from 'fastify';
import type { AppOptions } from './app.ts';
import { removeChildFiles } from './files.ts';

export async function accountRoutes(app: FastifyInstance, o: AppOptions) {
  app.delete('/api/me', async (req, reply) => {
    const kids = o.db.prepare('SELECT id FROM children WHERE parent_id = ?').all(req.parentId) as { id: string }[];
    for (const k of kids) await removeChildFiles(o.dataDir, k.id);
    o.db.prepare('DELETE FROM parents WHERE id = ?').run(req.parentId); // cascades to sessions, children, rows
    reply.clearCookie('sid', { path: '/' });
    return reply.code(204).send();
  });
}
