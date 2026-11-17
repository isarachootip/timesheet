import type pg from 'pg';

export interface ConnectablePool<TClient extends { release: () => void } = pg.PoolClient> {
  connect: () => Promise<TClient>;
}

export function buildPoolConfig(env?: NodeJS.ProcessEnv): pg.PoolConfig;
export function resolveDbHostLabel(env?: NodeJS.ProcessEnv): string;
export function withPoolClient<TResult, TClient extends { release: () => void } = pg.PoolClient>(
  targetPool: ConnectablePool<TClient>,
  fn: (client: TClient) => Promise<TResult>
): Promise<TResult>;
export const pool: pg.Pool;
