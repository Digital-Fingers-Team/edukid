import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../src/db.ts';
import { buildApp } from '../src/app.ts';
import { addChild, makeApp, multipart, signup } from './helpers.ts';

test('web files added after start are served, and missing assets are 404 not index.html', async () => {
  const web = await mkdtemp(join(tmpdir(), 'edukid-web-'));
  await writeFile(join(web, 'index.html'), '<!doctype html><title>EduKid</title>');
  await mkdir(join(web, 'assets'));
  const app = await buildApp({ db: openDb(':memory:'), dataDir: await mkdtemp(join(tmpdir(), 'd-')), cookieSecure: false, webDir: web });
  await app.ready();
  await writeFile(join(web, 'assets', 'index-NEW.js'), 'console.log(2)'); // a rebuild while the server runs
  const js = await app.inject({ method: 'GET', url: '/assets/index-NEW.js' });
  assert.equal(js.statusCode, 200);
  assert.match(String(js.headers['content-type']), /javascript/);
  const missing = await app.inject({ method: 'GET', url: '/assets/index-OLD.js' });
  assert.equal(missing.statusCode, 404);
});

test('each child can keep at most 24 recordings', async () => {
  const { app, db } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  await app.inject({ method: 'PATCH', url: `/api/children/${c.id}`, headers, payload: { recordingConsent: true } });
  const ins = db.prepare('INSERT INTO recordings (id, child_id, created_at, duration_sec, mime, file) VALUES (?, ?, ?, 10, ?, ?)');
  for (let i = 0; i < 24; i++) ins.run(`r${i}`, c.id, i, 'audio/webm', '/nonexistent');
  const m = multipart({ durationSec: '10' }, { name: 'audio', filename: 'a.webm', type: 'audio/webm', data: Buffer.from('x') });
  const res = await app.inject({ method: 'POST', url: `/api/children/${c.id}/recordings`, payload: m.payload, headers: { ...headers, ...m.headers } });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error, 'too_many_recordings');
});

test('an overnight session is stored with its duration capped, not rejected', async () => {
  const { app } = await makeApp();
  const { headers } = await signup(app);
  const c = await addChild(app, headers);
  const res = await app.inject({ method: 'PUT', url: `/api/children/${c.id}/sessions/sess-long-1`, headers,
    payload: { date: '2026-09-24', startedAt: 1, durationSec: 40_000, levels: [1], smooth: 3, bumpy: 0, corrections: 0, note: '' } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().durationSec, 7200);
});

test('a spoofed X-Forwarded-For does not get around the login rate limit', async () => {
  const { app } = await makeApp();
  let last = 0;
  for (let i = 0; i < 11; i++) {
    last = (await app.inject({ method: 'POST', url: '/api/auth/login', remoteAddress: '127.0.0.1',
      headers: { 'x-forwarded-for': `10.0.0.${i}, 203.0.113.7` },
      payload: { email: 'x@example.com', password: 'whatever1' } })).statusCode;
  }
  assert.equal(last, 429);
});
