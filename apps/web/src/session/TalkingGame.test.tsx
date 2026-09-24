import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Child } from '../../../../shared/types';
import { speech } from '../content';
import { clearLocal, db } from '../store/db';
import { TalkingGame } from './TalkingGame';

const child: Child = { id: 'c1', name: 'نور', kg: 1, avatar: '1F981', stage: 1, stageSince: '2026-01-01',
  level: 1, recordingConsent: false, updatedAt: 1 };

beforeEach(async () => {
  await clearLocal();
  await db.children.put(child);
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
});

describe('TalkingGame', () => {
  it('each tap saves the session, so closing the app keeps the taps', async () => {
    render(<TalkingGame child={child} onEnd={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'كلام ناعم' }));
    expect(await screen.findByText(speech.praise[0]!)).toBeTruthy();
    await waitFor(async () => {
      const all = await db.sessions.toArray();
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({ childId: 'c1', smooth: 1, bumpy: 0, levels: [1] });
    });
    expect(await db.outbox.count()).toBe(1);
  });

  it('shows nothing to say for early bumpy taps, and a gentle request once praise is 5:1', async () => {
    render(<TalkingGame child={child} onEnd={() => {}} />);
    const smooth = screen.getByRole('button', { name: 'كلام ناعم' });
    const bumpy = screen.getByRole('button', { name: 'فيه مطبات' });
    fireEvent.click(bumpy);
    expect(await screen.findByText('كمّلوا عادي، ولا تعليق.')).toBeTruthy();
    for (let i = 0; i < 5; i++) fireEvent.click(smooth);
    fireEvent.click(bumpy);
    expect(await screen.findByText(speech.correction[0]!)).toBeTruthy();
  });

  it('records level changes in order', async () => {
    const onEnd = vi.fn();
    render(<TalkingGame child={child} onEnd={onEnd} />);
    fireEvent.click(screen.getByRole('button', { name: 'مستوى أصعب' }));
    fireEvent.click(screen.getByRole('button', { name: 'كلام ناعم' }));
    fireEvent.click(screen.getByRole('button', { name: 'خلصنا' }));
    await waitFor(() => expect(onEnd).toHaveBeenCalled());
    expect(onEnd.mock.calls[0]![0]).toMatchObject({ levels: [1, 2], smooth: 1 });
  });
});
