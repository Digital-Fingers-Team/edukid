import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { clearLocal, db } from '../store/db';
import { addDays, todayKey } from '../logic/dates';
import { ChildLayout } from './ChildLayout';
import { RatePage } from './RatePage';

beforeEach(async () => {
  await clearLocal();
  await db.children.put({ id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
    level: 1, recordingConsent: false, updatedAt: 1 });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

const renderRate = () => render(
  <MemoryRouter initialEntries={['/child/c1/rate']}>
    <Routes><Route path="/child/:childId" element={<ChildLayout />}>
      <Route index element={<p>home</p>} />
      <Route path="rate" element={<RatePage />} />
    </Route></Routes>
  </MemoryRouter>);

describe('RatePage', () => {
  it("saves today's rating from one tap", async () => {
    renderRate();
    fireEvent.click(await screen.findByRole('radio', { name: '٢' }));
    await waitFor(async () => expect((await db.ratings.get(['c1', todayKey()]))?.value).toBe(2));
    expect(await screen.findByRole('status')).toBeTruthy();
  });

  it('can fill in yesterday but not other days', async () => {
    renderRate();
    fireEvent.click(await screen.findByRole('tab', { name: 'امبارح' }));
    fireEvent.click(screen.getByRole('radio', { name: '٠' }));
    await waitFor(async () => expect((await db.ratings.get(['c1', addDays(todayKey(), -1)]))?.value).toBe(0));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /قبل/ })).toBeNull();
  });
});
