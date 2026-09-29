import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { clearLocal, db } from '../store/db';
import { addDays, todayKey, weekStart } from '../logic/dates';
import { ChildLayout } from './ChildLayout';
import { ProgressPage } from './ProgressPage';

beforeEach(async () => {
  await clearLocal();
  await db.children.put({ id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
    level: 1, recordingConsent: false, updatedAt: 1 });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

const renderProgress = () => render(
  <MemoryRouter initialEntries={['/child/c1/progress']}>
    <Routes><Route path="/child/:childId" element={<ChildLayout />}>
      <Route path="progress" element={<ProgressPage />} />
    </Route></Routes>
  </MemoryRouter>);

describe('ProgressPage', () => {
  it('moves to stage 2 when the parent accepts the proposal', async () => {
    const current = weekStart(todayKey());
    for (const back of [21, 14, 7]) for (let d = 0; d < 5; d++) {
      await db.ratings.put({ childId: 'c1', date: addDays(addDays(current, -back), d), value: d % 2, updatedAt: 1 });
    }
    renderProgress();
    fireEvent.click(await screen.findByRole('button', { name: 'ننتقل للمرحلة التانية' }, { timeout: 15000 }));
    await waitFor(async () => {
      const c = await db.children.get('c1');
      expect(c?.stage).toBe(2);
      expect(c?.stageSince).toBe(todayKey());
    });
  });

  it('draws the chart with an accessible summary', async () => {
    await db.ratings.put({ childId: 'c1', date: todayKey(), value: 3, updatedAt: 1 });
    renderProgress();
    expect(await screen.findByRole('img', { name: /تقييمات آخر ٢٨ يوم/ })).toBeTruthy();
  });
});
