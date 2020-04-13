import pg from "pg";

import { DbConfig } from "./index";

export function createPgPool(config: Readonly<DbConfig>): {pool: pg.Pool; teardown(): Promise<void>} {
  const poolConfig: pg.PoolConfig = {
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.name,
    max: 10,
    idleTimeoutMillis: 1000,
  };

  const pool: pg.Pool = new pg.Pool(poolConfig);

  async function teardown(): Promise<void> {
    await pool.end();
  }

  return {pool, teardown};
}

/**
 * Async resource manager for a Postgres pool.
 *
 * @param config Database config
 * @param fn Inner function to call with a postgres pool.
 */
export async function withPgPool<R>(config: Readonly<DbConfig>, fn: (pool: pg.Pool) => Promise<R>): Promise<R> {
  const {pool, teardown} = createPgPool(config);
  try {
    return await fn(pool);
  } finally {
    await teardown();
  }
}
