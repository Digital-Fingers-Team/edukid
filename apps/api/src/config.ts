import { resolve } from 'node:path';

export interface Config { port: number; host: string; dataDir: string; cookieSecure: boolean }

export function readConfig(env = process.env): Config {
  return {
    port: Number(env.PORT ?? 4410),
    host: env.HOST ?? '127.0.0.1',
    dataDir: resolve(env.DATA_DIR ?? new URL('../data', import.meta.url).pathname),
    cookieSecure: env.NODE_ENV === 'production',
  };
}
