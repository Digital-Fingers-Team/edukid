import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { clearLocal, db } from '../store/db';
import { ChildLayout } from '../pages/ChildLayout';
import { GameShell } from './GameShell';

beforeEach(async () => {
  await clearLocal();
  await db.children.put({ id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
    level: 1, recordingConsent: false, updatedAt: 1 });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

function renderShell() {
  render(
    <MemoryRouter initialEntries={['/child/c1/voice/x']}>
      <Routes>
        <Route path="/child/:childId" element={<ChildLayout />}>
          <Route path="voice/x" element={
            <GameShell title="لعبة" hint="جرّب" render={(getLevel) => <p>level:{getLevel()}</p>} />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('GameShell', () => {
  it('denied mic shows hold-to-play fallback that drives the level', async () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: vi.fn(async () => { throw new Error('denied'); }) } });
    vi.stubGlobal('AudioContext', class {});
    renderShell();
    fireEvent.click(await screen.findByRole('button', { name: 'يلا نبدأ' }));
    const hold = await screen.findByRole('button', { name: 'دوس وإنت بتتكلم' });
    expect(screen.getByText(/المايك مش شغال/)).toBeTruthy();
    fireEvent.pointerDown(hold);
    expect(hold.className).toContain('held');
  });

  it('works on devices with no microphone API at all', async () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined });
    renderShell();
    fireEvent.click(await screen.findByRole('button', { name: 'يلا نبدأ' }));
    expect(await screen.findByRole('button', { name: 'دوس وإنت بتتكلم' })).toBeTruthy();
  });
});
