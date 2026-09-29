import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Me } from '../../../../shared/types';
import { api, ApiError, NetworkError } from '../api/client';
import { clearLocal, getMeta, setMeta } from '../store/db';
import { setUnauthorizedHandler } from '../store/sync';

export type AuthState = { status: 'loading' } | { status: 'guest' } | { status: 'parent'; me: Me };
interface AuthApi {
  state: AuthState;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let alive = true; // the check is async; ignore its result if the app has unmounted meanwhile
    setUnauthorizedHandler(() => setState({ status: 'guest' }));
    (async () => {
      try {
        const me = await api<Me>('GET', '/api/me');
        await setMeta('me', me);
        if (alive) setState({ status: 'parent', me });
      } catch (err) {
        const cached = await getMeta<Me>('me');
        if (!alive) return;
        const serverDown = err instanceof NetworkError || (err instanceof ApiError && err.status >= 500);
        if (serverDown && cached) setState({ status: 'parent', me: cached });
        else setState({ status: 'guest' });
      }
    })();
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(async (path: string, email: string, password: string) => {
    const me = await api<Me>('POST', path, { email: email.trim(), password });
    const previous = await getMeta<Me>('me');
    if (previous && previous.id !== me.id) await clearLocal(); // another family's data must not leak
    await setMeta('me', me);
    setState({ status: 'parent', me });
  }, []);

  const value = useMemo<AuthApi>(() => ({
    state,
    login: (e, p) => signIn('/api/auth/login', e, p),
    register: (e, p) => signIn('/api/auth/register', e, p),
    logout: async () => {
      await api('POST', '/api/auth/logout').catch((err) => { if (!(err instanceof ApiError)) throw err; });
      await clearLocal();
      setState({ status: 'guest' });
    },
  }), [state, signIn]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
