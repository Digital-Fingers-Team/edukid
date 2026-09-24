import type { Kg, Level } from '../../../../shared/types';
import lettersAr from '../../../../content/letters-ar.json';
import lettersEn from '../../../../content/letters-en.json';
import wordsEn from '../../../../content/words-en.json';
import numbers from '../../../../content/numbers.json';
import shapes from '../../../../content/shapes.json';
import colors from '../../../../content/colors.json';
import speechJson from '../../../../content/speech.json';
import guideJson from '../../../../content/guide.json';
import libraryJson from '../../../../content/library.json';
import stickersJson from '../../../../content/stickers.json';

export type Subject = 'ar-letters' | 'en-letters' | 'en-words' | 'numbers' | 'shapes' | 'colors' | 'en-colors' | 'math';
export type ShapeName = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart';
export type GameKind = 'listen' | 'match' | 'count' | 'trace';

export interface ContentItem {
  id: string; subject: Subject; kg: Kg; lang: 'ar' | 'en';
  label: string; say: string;
  art?: string; word?: string; swatch?: string; shape?: ShapeName; count?: number;
}
export interface Card { text: string; art: string }
export interface Story { id: string; title: string; frames: Card[] }
export interface GuideSection { id: string; title: string; body: string[]; do?: string[]; dont?: string[] }

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (n: number | string) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]!);

const all: ContentItem[] = [
  ...lettersAr.map((l, i): ContentItem => ({
    id: `ar-${i + 1}`, subject: 'ar-letters', kg: 1, lang: 'ar',
    label: l.letter, say: `${l.name}، ${l.word}`, word: l.word, art: l.art,
  })),
  ...lettersEn.map((l): ContentItem => ({
    id: `en-${l.letter}`, subject: 'en-letters', kg: 1, lang: 'en',
    label: `${l.letter}${l.letter.toLowerCase()}`, say: `${l.letter}, ${l.word}`, word: l.word, art: l.art,
  })),
  ...wordsEn.map((w): ContentItem => ({
    id: `word-${w.word}`, subject: 'en-words', kg: w.kg as Kg, lang: 'en', label: w.word, say: w.word, art: w.art,
  })),
  ...numbers.map((n): ContentItem => ({
    id: `num-${n.n}`, subject: 'numbers', kg: n.n <= 10 ? 1 : 2, lang: 'ar',
    label: toArabicDigits(n.n), say: n.ar, count: n.n,
  })),
  ...shapes.map((s): ContentItem => ({
    id: `shape-${s.shape}`, subject: 'shapes', kg: 1, lang: 'ar', label: s.ar, say: s.ar, shape: s.shape as ShapeName,
  })),
  ...colors.map((c): ContentItem => ({
    id: `color-${c.id}`, subject: 'colors', kg: 1, lang: 'ar', label: c.ar, say: c.ar, swatch: c.hex,
  })),
  ...colors.map((c): ContentItem => ({
    id: `en-color-${c.id}`, subject: 'en-colors', kg: 1, lang: 'en', label: c.en, say: c.en, swatch: c.hex,
  })),
  ...mathItems(),
];

function mathItems(): ContentItem[] {
  const out: ContentItem[] = [];
  const word = (n: number) => numbers.find((x) => x.n === n)?.ar ?? 'صفر';
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; a + b <= 10; b++) {
      out.push({ id: `math-${a}+${b}`, subject: 'math', kg: 2, lang: 'ar',
        label: `${toArabicDigits(a)} + ${toArabicDigits(b)}`, say: `${word(a)} زائد ${word(b)}`, count: a + b });
    }
  }
  for (let a = 2; a <= 10; a++) {
    for (let b = 1; b < a; b++) {
      out.push({ id: `math-${a}-${b}`, subject: 'math', kg: 2, lang: 'ar',
        label: `${toArabicDigits(a)} − ${toArabicDigits(b)}`, say: `${word(a)} ناقص ${word(b)}`, count: a - b });
    }
  }
  return out;
}

export function itemsFor(subject: Subject, kg: Kg): ContentItem[] {
  return all.filter((i) => i.subject === subject && i.kg <= kg);
}

export const SUBJECTS: { id: Subject; title: string; games: GameKind[]; art: string; minKg: Kg }[] = [
  { id: 'ar-letters', title: 'الحروف العربي', games: ['listen', 'match', 'trace'], art: '1F407', minKg: 1 },
  { id: 'numbers', title: 'الأرقام', games: ['listen', 'count', 'match', 'trace'], art: '1F522', minKg: 1 },
  { id: 'shapes', title: 'الأشكال', games: ['listen'], art: '1F537', minKg: 1 },
  { id: 'colors', title: 'الألوان', games: ['listen'], art: '1F3A8', minKg: 1 },
  { id: 'en-letters', title: 'English ABC', games: ['listen', 'match', 'trace'], art: '1F524', minKg: 1 },
  { id: 'en-words', title: 'English words', games: ['listen', 'match'], art: '1F408', minKg: 1 },
  { id: 'en-colors', title: 'Colors', games: ['listen'], art: '1F308', minKg: 1 },
  { id: 'math', title: 'جمع وطرح', games: ['count'], art: '2795', minKg: 2 },
];

export const speech = speechJson as {
  praise: string[]; correction: string[]; words: Card[]; phrases: Card[]; sentences: Card[];
  stories: Story[]; prompts: string[];
};

export type Deck =
  | { kind: 'cards'; cards: Card[] }
  | { kind: 'stories'; stories: Story[] }
  | { kind: 'prompts'; prompts: string[] };

export function levelDeck(level: Level): Deck {
  switch (level) {
    case 1: return { kind: 'cards', cards: speech.words };
    case 2: return { kind: 'cards', cards: speech.phrases };
    case 3: return { kind: 'cards', cards: speech.sentences };
    case 4: return { kind: 'stories', stories: speech.stories };
    case 5: return { kind: 'prompts', prompts: speech.prompts };
  }
}

export const LEVEL_NAMES: Record<Level, string> = {
  1: 'كلمة واحدة', 2: 'كلمتين تلاتة', 3: 'جملة', 4: 'نحكي قصة', 5: 'دردشة حرة',
};

export const guide = guideJson as GuideSection[];
export const library = libraryJson as {
  books: { id: string; title: string; file: string; art: string }[];
  videos: { id: string; title: string; youtubeId: string }[];
};
export const stickers = stickersJson.stickers.map((art) => ({ id: `st-${art}`, art }));
export const avatars = stickersJson.avatars;

/** Art codes used by UI chrome (not content). Keep in sync with scripts/fetch-art.mjs. */
export const UI_ART = ['1F522', '1F537', '1F3A8', '1F524', '1F308', '2795', '1F422', '1F388', '1F40D', '1FAE7',
  '1F3B5', '1F4DA', '1F4FA', '1F3A4', '1F4C8', '2699', '1F4D8', '1F31F', '1F96C', '1F4AC', '1F442', '1F9E9', '270F',
  '1F34E', '2B50', '1F41F', '1F33B', '1F986'];

export function allArtCodes(): string[] {
  const codes = new Set<string>(UI_ART);
  for (const i of all) if (i.art) codes.add(i.art);
  for (const c of [...speech.words, ...speech.phrases, ...speech.sentences]) codes.add(c.art);
  for (const s of speech.stories) for (const f of s.frames) codes.add(f.art);
  for (const s of stickers) codes.add(s.art);
  for (const a of avatars) codes.add(a);
  for (const b of library.books) codes.add(b.art);
  for (const s of SUBJECTS) codes.add(s.art);
  return [...codes].sort();
}
