// Downloads every OpenMoji SVG the app references into public/art/.
// OpenMoji — the open-source emoji and icon project. License: CC BY-SA 4.0
import { mkdir, writeFile, access } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const out = resolve(here, '../public/art');
const VERSION = '17.0.0';

const json = (f) => JSON.parse(readFileSync(resolve(root, 'content', f), 'utf8'));
// Keep in sync with UI_ART in src/content/index.ts
const codes = new Set(['1F522', '1F537', '1F3A8', '1F524', '1F308', '2795', '1F422', '1F388', '1F40D', '1FAE7',
  '1F3B5', '1F4DA', '1F4FA', '1F3A4', '1F4C8', '2699', '1F4D8', '1F31F', '1F96C', '1F4AC', '1F442', '1F9E9', '270F',
  '1F34E', '2B50', '1F41F', '1F33B', '1F986']);
const add = (x) => x && codes.add(x);
json('letters-ar.json').forEach((x) => add(x.art));
json('letters-en.json').forEach((x) => add(x.art));
json('words-en.json').forEach((x) => add(x.art));
const sp = json('speech.json');
[...sp.words, ...sp.phrases, ...sp.sentences].forEach((x) => add(x.art));
sp.stories.forEach((s) => s.frames.forEach((f) => add(f.art)));
const st = json('stickers.json');
[...st.stickers, ...st.avatars].forEach(add);
json('library.json').books.forEach((b) => add(b.art));

await mkdir(out, { recursive: true });
let fetched = 0;
for (const code of codes) {
  const file = resolve(out, `${code}.svg`);
  try { await access(file); continue; } catch {}
  const res = await fetch(`https://cdn.jsdelivr.net/npm/openmoji@${VERSION}/color/svg/${code}.svg`);
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  await writeFile(file, await res.text());
  fetched++;
}
console.log(`art: ${codes.size} codes, ${fetched} downloaded`);
