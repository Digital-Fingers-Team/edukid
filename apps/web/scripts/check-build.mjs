import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const fail = (m) => { console.error(`check-build: ${m}`); process.exit(1); };
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'pwa-192x192.png', 'pwa-512x512.png', 'art/1F422.svg']) {
  if (!existsSync(resolve(dist, f))) fail(`missing ${f}`);
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.dir !== 'rtl' || manifest.lang !== 'ar') fail('manifest must be ar/rtl');
const sw = readFileSync(resolve(dist, 'sw.js'), 'utf8');
if (!sw.includes('index.html')) fail('index.html is not precached');
if (!sw.includes('1F422.svg')) fail('art is not precached');
console.log('check-build: ok');
