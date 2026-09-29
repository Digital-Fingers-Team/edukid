import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../src/db.ts';
import { buildApp } from '../src/app.ts';

async function withWeb() {
  const web = await mkdtemp(join(tmpdir(), 'edukid-web-'));
  const books = await mkdtemp(join(tmpdir(), 'edukid-books-'));
  await writeFile(join(web, 'index.html'), '<!doctype html><title>EduKid</title>');
  await mkdir(join(web, 'assets'));
  await writeFile(join(web, 'assets', 'app-abc123.js'), 'console.log(1)');
  await writeFile(join(web, 'sw.js'), 'self.x=1');
  await writeFile(join(books, 'Arabic_KG1.pdf'), '%PDF-1.4');
  const app = await buildApp({ db: openDb(':memory:'), dataDir: await mkdtemp(join(tmpdir(), 'd-')), cookieSecure: false, webDir: web, booksDir: books });
  return app;
}

test('serves the web app with an SPA fallback for client routes', async () => {
  const app = await withWeb();
  const home = await app.inject({ method: 'GET', url: '/' });
  assert.equal(home.statusCode, 200);
  assert.match(home.body, /EduKid/);
  assert.match(String(home.headers['cache-control']), /no-cache/);
  const deep = await app.inject({ method: 'GET', url: '/child/abc/session' });
  assert.equal(deep.statusCode, 200);
  assert.match(deep.body, /EduKid/);
});

test('hashed assets are cached long, the service worker is not', async () => {
  const app = await withWeb();
  const js = await app.inject({ method: 'GET', url: '/assets/app-abc123.js' });
  assert.equal(js.statusCode, 200);
  assert.match(String(js.headers['cache-control']), /immutable/);
  const sw = await app.inject({ method: 'GET', url: '/sw.js' });
  assert.match(String(sw.headers['cache-control']), /no-cache/);
});

test('unknown API routes stay JSON 404s, not the web app', async () => {
  const app = await withWeb();
  const res = await app.inject({ method: 'GET', url: '/api/nope' });
  assert.equal(res.statusCode, 404);
  assert.doesNotMatch(res.body, /EduKid/);
});

test('books are served from the books directory', async () => {
  const app = await withWeb();
  const res = await app.inject({ method: 'GET', url: '/books/Arabic_KG1.pdf' });
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /%PDF/);
  assert.equal((await app.inject({ method: 'GET', url: '/books/missing.pdf' })).statusCode, 404);
});
