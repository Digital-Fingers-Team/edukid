import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SUBJECTS, allArtCodes, itemsFor, levelDeck, speech, stickers, toArabicDigits } from './index';

describe('content', () => {
  it('has 28 Arabic letters and 26 English letters', () => {
    expect(itemsFor('ar-letters', 1)).toHaveLength(28);
    expect(itemsFor('en-letters', 1)).toHaveLength(26);
  });
  it('kg 2 includes kg 1 items and more', () => {
    expect(itemsFor('numbers', 1)).toHaveLength(10);
    expect(itemsFor('numbers', 2)).toHaveLength(20);
    expect(itemsFor('en-words', 2).length).toBeGreaterThan(itemsFor('en-words', 1).length);
  });
  it('math exists only for kg 2 and answers are within 0–10', () => {
    expect(itemsFor('math', 1)).toHaveLength(0);
    const math = itemsFor('math', 2);
    expect(math.length).toBeGreaterThan(20);
    for (const m of math) expect(m.count! >= 0 && m.count! <= 10).toBe(true);
  });
  it('ids are unique across all subjects', () => {
    const ids = SUBJECTS.flatMap((s) => itemsFor(s.id, 2).map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every level has a deck', () => {
    expect(levelDeck(1)).toMatchObject({ kind: 'cards' });
    expect(levelDeck(4)).toMatchObject({ kind: 'stories' });
    expect(levelDeck(5)).toMatchObject({ kind: 'prompts' });
  });
  it('praise phrases outnumber correction phrases', () => {
    expect(speech.praise.length).toBeGreaterThan(speech.correction.length);
  });
  it('no child-facing text tells the child to slow down or calm down', () => {
    const childText = JSON.stringify([speech.words, speech.phrases, speech.sentences, speech.stories, speech.prompts]);
    for (const banned of ['اهدى', 'براحة', 'ببطء', 'خد نفس']) expect(childText).not.toContain(banned);
  });
  it('converts digits', () => {
    expect(toArabicDigits(15)).toBe('١٥');
  });
  it('every art code has a downloaded svg', () => {
    const missing = allArtCodes().filter((c) => !existsSync(resolve(__dirname, '../../public/art', `${c}.svg`)));
    expect(missing).toEqual([]);
    expect(stickers.length).toBe(24);
  });
});
