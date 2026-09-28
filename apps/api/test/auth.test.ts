import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, signup } from './helpers.ts';
import { hashPassword, verifyPassword } from '../src/auth.ts';

test('password hashes verify and do not leak the password', async () => {
  const h = await hashPassword('secret123');
  assert.ok(h.startsWith('scrypt$'));
  assert.ok(!h.includes('secret123'));
  assert.equal(await verifyPassword('secret123', h), true);
  assert.equal(await verifyPassword('wrong-one', h), false);
});

test('register sets an httpOnly cookie and /api/me returns the parent', async () => {
  const { app } = await makeApp();
  const res = await app.inject({ method: 'POST', url: '/api/auth/register',
    payload: { email: 'Mama@Example.com', password: 'secret123' } });
  assert.equal(res.statusCode, 201);
  const sid = res.cookies.find((c) => c.name === 'sid')!;
  assert.equal(sid.httpOnly, true);
  assert.equal(sid.sameSite, 'Lax');
  const me = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: `sid=${sid.value}` } });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().email, 'mama@example.com');
});

test('duplicate email is rejected with 409', async () => {
  const { app } = await makeApp();
  await signup(app, 'a@example.com');
  const res = await app.inject({ method: 'POST', url: '/api/auth/register',
    payload: { email: 'A@example.com', password: 'secret123' } });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error, 'email_taken');
});

test('short passwords and bad emails are rejected', async () => {
  const { app } = await makeApp();
  const short = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'a@b.co', password: '123' } });
  assert.equal(short.statusCode, 400);
  const bad = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'nope', password: 'secret123' } });
  assert.equal(bad.statusCode, 400);
});

test('login checks the password; logout ends the session', async () => {
  const { app } = await makeApp();
  await signup(app, 'a@example.com', 'secret123');
  const wrong = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'a@example.com', password: 'nope-nope' } });
  assert.equal(wrong.statusCode, 401);
  const ok = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'a@example.com', password: 'secret123' } });
  assert.equal(ok.statusCode, 200);
  const cookie = `sid=${ok.cookies.find((c) => c.name === 'sid')!.value}`;
  const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } });
  assert.equal(out.statusCode, 204);
  const me = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } });
  assert.equal(me.statusCode, 401);
});

test('/api/me without a cookie is 401', async () => {
  const { app } = await makeApp();
  const me = await app.inject({ method: 'GET', url: '/api/me' });
  assert.equal(me.statusCode, 401);
});

test('login is rate limited', async () => {
  const { app } = await makeApp();
  let last = 0;
  for (let i = 0; i < 11; i++) {
    last = (await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'x@example.com', password: 'whatever1' } })).statusCode;
  }
  assert.equal(last, 429);
});
