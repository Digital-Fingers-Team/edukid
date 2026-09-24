import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Child } from '../../../../shared/types';
import { clearLocal, db } from '../store/db';
import { todayKey, addDays, weekStart } from '../logic/dates';
import { ChildLayout } from './ChildLayout';
import { ChildHome } from './ChildHome';

const base: Child = { id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
  level: 1, recordingConsent: false, updatedAt: 1 };

function renderHome() {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
  render(
    <MemoryRouter initialEntries={['/child/c1']}>
      <Routes><Route path="/child/:childId" element={<ChildLayout />}><Route index element={<ChildHome />} /></Route></Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => { await clearLocal(); });

describe('ChildHome', () => {
  it("greets the child and shows today's plan as not done", async () => {
    await db.children.put(base);
    renderHome();
    expect(await screen.findByText('أهلاً يا نور')).toBeTruthy();
    expect(screen.getByText('جلسة الكلام')).toBeTruthy();
    expect(screen.queryByText('خلصناها النهارده')).toBeNull();
  });

  it('marks the session done after a session of at least a minute today', async () => {
    await db.children.put(base);
    await db.sessions.put({ id: 's1', childId: 'c1', date: todayKey(), startedAt: Date.now(), durationSec: 300,
      levels: [1], smooth: 5, bumpy: 1, corrections: 0, note: '', updatedAt: 1 });
    renderHome();
    expect(await screen.findByText('خلصناها النهارده')).toBeTruthy();
  });

  it('shows the weekly target in stage 2', async () => {
    await db.children.put({ ...base, stage: 2, stageSince: todayKey() });
    renderHome();
    expect(await screen.findByText('الأسبوع ده: ٠ من ٣ جلسات')).toBeTruthy();
  });

  it('points the parent to the stage-2 proposal when eligible', async () => {
    await db.children.put(base);
    const current = weekStart(todayKey());
    for (const back of [21, 14, 7]) {
      for (let d = 0; d < 5; d++) {
        await db.ratings.put({ childId: 'c1', date: addDays(addDays(current, -back), d), value: 1, updatedAt: 1 });
      }
    }
    renderHome();
    expect(await screen.findByText(/جاهزين للمرحلة التانية/)).toBeTruthy();
  });
});
