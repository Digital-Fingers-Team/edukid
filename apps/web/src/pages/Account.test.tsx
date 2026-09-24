import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth/AuthProvider';
import { clearLocal, setMeta } from '../store/db';
import { Account } from './Account';

beforeEach(async () => {
  await clearLocal();
  await setMeta('me', { id: 'p1', email: 'mama@example.com' });
});

describe('Account', () => {
  it('only deletes the account after typing the confirmation word', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) =>
      url === '/api/me' && init?.method === 'DELETE' ? new Response(null, { status: 204 })
        : new Response(JSON.stringify({ id: 'p1', email: 'mama@example.com' })));
    vi.stubGlobal('fetch', fetchMock);
    render(<MemoryRouter><AuthProvider><Account /></AuthProvider></MemoryRouter>);
    const del = await screen.findByRole('button', { name: 'امسح الحساب نهائيًا' });
    expect((del as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/اكتب «امسح»/), { target: { value: 'امسح' } });
    expect((del as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(del);
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([u, i]) => u === '/api/me' && (i as RequestInit | undefined)?.method === 'DELETE')).toBe(true));
  });
});
