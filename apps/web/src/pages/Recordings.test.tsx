import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Child } from '../../../../shared/types';
import { clearLocal, db } from '../store/db';
import { ChildLayout } from './ChildLayout';
import { Recordings } from './Recordings';

const child: Child = { id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
  level: 1, recordingConsent: false, updatedAt: 1 };

beforeEach(async () => { await clearLocal(); });

const renderRec = () => render(
  <MemoryRouter initialEntries={['/child/c1/recordings']}>
    <Routes><Route path="/child/:childId" element={<ChildLayout />}>
      <Route path="recordings" element={<Recordings />} />
    </Route></Routes>
  </MemoryRouter>);

describe('Recordings', () => {
  it('hides recording until the parent gives consent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    await db.children.put(child);
    renderRec();
    expect(await screen.findByText(/محتاجين موافقتك الأول/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'ابدأ التسجيل' })).toBeNull();
  });

  it('with consent lists saved samples from the server', async () => {
    await db.children.put({ ...child, recordingConsent: true });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/recordings')
      ? new Response(JSON.stringify([{ id: 'r1', childId: 'c1', createdAt: Date.UTC(2026, 8, 1), durationSec: 95, mime: 'audio/webm' }]))
      : new Response('{}')));
    renderRec();
    expect(await screen.findByRole('button', { name: 'ابدأ التسجيل' })).toBeTruthy();
    expect(await screen.findByText(/١:٣٥/)).toBeTruthy();
  });
});
