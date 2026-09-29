import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { clearLocal, db } from '../store/db';
import { ChildLayout } from '../pages/ChildLayout';
import { LearnRound } from './LearnRound';

beforeEach(async () => {
  await clearLocal();
  await db.children.put({ id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
    level: 1, recordingConsent: false, updatedAt: 1 });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

const renderRound = () => render(
  <MemoryRouter initialEntries={['/child/c1/learn/colors/listen']}>
    <Routes><Route path="/child/:childId" element={<ChildLayout />}>
      <Route path="learn/:subject/:game" element={<LearnRound />} />
    </Route></Routes>
  </MemoryRouter>);

describe('LearnRound', () => {
  it('a first-try answer moves the item up a box', async () => {
    renderRound();
    const game = await screen.findByText((_, el) => el?.getAttribute('data-target-id') != null);
    const target = game.getAttribute('data-target-id')!;
    fireEvent.click(game.querySelector(`[data-id="${target}"]`)!);
    await waitFor(async () => expect((await db.items.get(['c1', target]))?.box).toBe(2), { timeout: 3000 });
  });

  it('a wrong first tap sends the item back to box 1 even after the right answer', async () => {
    renderRound();
    const game = await screen.findByText((_, el) => el?.getAttribute('data-target-id') != null);
    const target = game.getAttribute('data-target-id')!;
    const wrong = [...game.querySelectorAll('[data-id]')].find((b) => b.getAttribute('data-id') !== target)!;
    fireEvent.click(wrong);
    fireEvent.click(game.querySelector(`[data-id="${target}"]`)!);
    await waitFor(async () => expect((await db.items.get(['c1', target]))?.box).toBe(1), { timeout: 3000 });
  });
});
