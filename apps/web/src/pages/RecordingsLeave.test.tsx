import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { clearLocal, db } from '../store/db';
import { ChildLayout } from './ChildLayout';
import { Recordings } from './Recordings';

beforeEach(async () => {
  await clearLocal();
  await db.children.put({ id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
    level: 1, recordingConsent: true, updatedAt: 1 });
});

describe('Recordings', () => {
  it('leaving the page mid-recording stops the mic and uploads nothing', async () => {
    const trackStop = vi.fn();
    const child = await db.children.get('c1');
    const fetchMock = vi.fn(async (u: string, init?: RequestInit) => new Response(
      init?.method === 'POST' ? '{}'
        : u.includes('/sync') ? JSON.stringify({ child, sessions: [], ratings: [], items: [], stickers: [], now: 1 })
        : '[]'));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true,
      value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: trackStop }] })) } });
    class FakeRecorder {
      static isTypeSupported() { return true; }
      state = 'inactive'; mimeType = 'audio/webm';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['x']) }); this.onstop?.(); }
    }
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    const { unmount } = render(
      <MemoryRouter initialEntries={['/child/c1/recordings']}>
        <Routes><Route path="/child/:childId" element={<ChildLayout />}><Route path="recordings" element={<Recordings />} /></Route></Routes>
      </MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'ابدأ التسجيل' }));
    await screen.findByRole('button', { name: /وقّف/ });
    unmount();
    await new Promise((r) => setTimeout(r, 50));
    expect(trackStop).toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([, i]) => (i as RequestInit | undefined)?.method === 'POST')).toBe(false);
  });
});
