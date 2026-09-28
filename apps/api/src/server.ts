import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { readConfig } from './config.ts';
import { openDb } from './db.ts';
import { buildApp } from './app.ts';

const cfg = readConfig();
mkdirSync(join(cfg.dataDir, 'recordings'), { recursive: true });
const db = openDb(join(cfg.dataDir, 'edukid.sqlite'));
const app = await buildApp({ db, dataDir: cfg.dataDir, cookieSecure: cfg.cookieSecure, logger: true });
await app.listen({ port: cfg.port, host: cfg.host });
