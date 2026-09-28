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
});
