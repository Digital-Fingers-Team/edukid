import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMicLevel } from './useMicLevel';

function fakeMic() {
  const stops: ReturnType<typeof vi.fn>[] = [];
  const resolvers: ((s: MediaStream) => void)[] = [];
  const getUserMedia = vi.fn(() => new Promise<MediaStream>((res) => resolvers.push(res)));
  const makeStream = () => {
    const stop = vi.fn();
    stops.push(stop);
    return { getTracks: () => [{ stop }] } as unknown as MediaStream;
  };
  class Ctx {
    createAnalyser() { return { fftSize: 0, getFloatTimeDomainData() {} }; }
    createMediaStreamSource() { return { connect() {} }; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });
  vi.stubGlobal('AudioContext', Ctx);
  return { getUserMedia, resolveNext: () => resolvers.shift()!(makeStream()), stops };
}

afterEach(() => vi.unstubAllGlobals());

describe('useMicLevel', () => {
  it('a double tap opens the microphone only once', async () => {
    const mic = fakeMic();
    const { result, unmount } = renderHook(() => useMicLevel());
    let a!: Promise<void>, b!: Promise<void>;
    act(() => { a = result.current.start(); b = result.current.start(); });
    expect(mic.getUserMedia).toHaveBeenCalledTimes(1);
    await act(async () => { mic.resolveNext(); await a; await b; });
    unmount();
    expect(mic.stops.every((s) => s.mock.calls.length === 1)).toBe(true);
  });

  it('stops a stream that arrives after the game was left', async () => {
    const mic = fakeMic();
    const { result, unmount } = renderHook(() => useMicLevel());
    let p!: Promise<void>;
    act(() => { p = result.current.start(); });
    unmount();                                  // child pressed back during the permission prompt
    await act(async () => { mic.resolveNext(); await p; });
    expect(mic.stops[0]).toHaveBeenCalledTimes(1);
  });
});
