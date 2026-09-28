import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { addChild, makeApp, multipart, signup } from './helpers.ts';

test('DELETE /api/me removes the parent, children, rows and files', async () => {
  const { app, db, dataDir } = await makeApp();
  const { headers } = await signup(app, 'gone@example.com');
  const c = await addChild(app, headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers, payload: { recordingConsent: true } });
  await app.inject({ method: 'PUT', url: `/api/children/${c.id}/ratings/2026-09-24`, headers, payload: { value: 2 } });
  const m = multipart({ durationSec: '10' }, { name: 'audio', filename: 'a.webm', type: 'audio/webm', data: Buffer.from('x') });
  await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });

  const res = await app.inject({ method: 'DELETE', url: '/api/me', headers });
  assert.equal(res.statusCode, 204);
  assert.equal((await app.inject({ method: 'GET', url: '/api/me', headers })).statusCode, 401);
  for (const t of ['parents', 'children', 'ratings', 'recordings', 'auth_sessions']) {
    assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n, 0, t);
  }
  await assert.rejects(access(join(dataDir, 'recordings', c.id)));
});
