import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth/AuthProvider';
import { Welcome } from './Welcome';

afterEach(() => vi.unstubAllGlobals());

function setup(loginReply: Response) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    url === '/api/me' ? new Response('{"error":"unauthorized"}', { status: 401 }) : loginReply));
  render(<MemoryRouter><AuthProvider><Welcome /></AuthProvider></MemoryRouter>);
}

describe('Welcome', () => {
  it('explains the app and that it does not replace a specialist', async () => {
    setup(new Response('{}'));
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByText(/مش بديل عن أخصائي التخاطب/)).toBeTruthy();
  });
  it('shows a friendly Arabic message on wrong password', async () => {
    setup(new Response('{"error":"invalid_credentials"}', { status: 401 }));
    fireEvent.change(await screen.findByLabelText('الإيميل'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('كلمة السر'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    expect(await screen.findByText('الإيميل أو كلمة السر مش مظبوطين.')).toBeTruthy();
  });
  it('a server outage at startup keeps a signed-in parent signed in', async () => {
    const { setMeta } = await import('../store/db');
    await setMeta('me', { id: 'p1', email: 'mama@example.com' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad gateway', { status: 502 })));
    const { useAuth } = await import('../auth/AuthProvider');
    let status = '';
    function Probe() { status = useAuth().state.status; return null; }
    render(<MemoryRouter><AuthProvider><Probe /></AuthProvider></MemoryRouter>);
    await vi.waitFor(() => expect(status).toBe('parent'));
  });
});
