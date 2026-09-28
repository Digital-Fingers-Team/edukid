import { api } from '../api/client';
import { db } from './db';
import { flush } from './outbox';

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

let running = false;
let again = false;

/** Sends pending writes. Safe to call often; concurrent calls fold into one run. */
export async function kick(): Promise<void> {
  if (running) { again = true; return; }
  running = true;
  try {
    do {
      again = false;
      const result = await flush(db, (m, p, b) => api(m, p, b));
      if (result === 'unauthorized') onUnauthorized?.();
      if (result !== 'done') break;
    } while (again);
  } finally {
    running = false;
  }
}

export function startBackgroundSync(): () => void {
  const onOnline = () => void kick();
  window.addEventListener('online', onOnline);
  const timer = window.setInterval(() => void kick(), 30_000);
  void kick();
  return () => {
    window.removeEventListener('online', onOnline);
    window.clearInterval(timer);
  };
}
