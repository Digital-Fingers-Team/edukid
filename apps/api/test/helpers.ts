import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../src/db.ts';
import { buildApp } from '../src/app.ts';

export async function makeApp() {
  const dataDir = await mkdtemp(join(tmpdir(), 'edukid-'));
  const db = openDb(':memory:');
  const app = await buildApp({ db, dataDir, cookieSecure: false });
  return { app, db, dataDir };
}
