import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearLocal, db } from '../store/db';
import { stickers } from '../content';
import { StickerReward } from './StickerReward';

beforeEach(async () => {
  await clearLocal();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

describe('StickerReward', () => {
  it('offers three stickers the child does not have yet and saves the chosen one', async () => {
    for (const s of stickers.slice(0, 20)) {
      await db.stickers.put({ childId: 'c1', stickerId: s.id, earnedAt: 1, updatedAt: 1 });
    }
    const onDone = vi.fn();
    render(<StickerReward childId="c1" onDone={onDone} />);
    const choices = await screen.findAllByRole('button', { name: /ملصق/ });
    expect(choices).toHaveLength(3);
    const owned = new Set(stickers.slice(0, 20).map((s) => s.art));
    for (const c of choices) expect(owned.has(c.getAttribute('data-art')!)).toBe(false);
    fireEvent.click(choices[0]!);
    await waitFor(async () => expect(await db.stickers.where('childId').equals('c1').count()).toBe(21));
    fireEvent.click(await screen.findByRole('button', { name: 'يلا' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('still rewards when every sticker is already earned', async () => {
    for (const s of stickers) await db.stickers.put({ childId: 'c1', stickerId: s.id, earnedAt: 1, updatedAt: 1 });
    render(<StickerReward childId="c1" onDone={() => {}} />);
    expect(await screen.findAllByRole('button', { name: /ملصق/ })).toHaveLength(3);
  });
});
