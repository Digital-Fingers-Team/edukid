import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, NetworkError } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('sends JSON and parses the reply', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(api('PUT', '/api/x', { a: 1 })).resolves.toEqual({ ok: 1 });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
  });
  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
    await expect(api('DELETE', '/api/x')).resolves.toBeUndefined();
  });
  it('throws ApiError with the server error code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"email_taken"}', { status: 409 })));
    await expect(api('POST', '/api/x', {})).rejects.toMatchObject({ status: 409, code: 'email_taken' });
    await expect(api('POST', '/api/x', {})).rejects.toBeInstanceOf(ApiError);
  });
  it('throws NetworkError when the request cannot be sent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(api('GET', '/api/x')).rejects.toBeInstanceOf(NetworkError);
  });
});
