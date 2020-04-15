import pg from "pg";
import util from "util";

/**
 * Represents an object allowing to do SQL queries.
 *
 * Known implementation are `pg.Pool`, `Database` or `Transaction`.
 */
export interface SimpleQueryable {
  /**
   * Execute a parametrized SQL query
   *
   * @see https://node-postgres.com/features/queries#parameterized-query
   *
   * @param query The SQL query with the parameter placeholders.
   * @param values List of parameters, can be empty
   * @return The result of the query
   */
  query(query: string, values: readonly unknown[]): Promise<pg.QueryResult>;
}

/**
 * Represents an object with advanced query utilities
 */
export interface Queryable extends SimpleQueryable {
  /**
   * Execute the provided parametrized SQL query.
   * If the query returns:
   * - 0 rows, then this method returns `undefined`
   * - 1 row, then this method returns this row
   * - 2 or more rows, then this methods throws an Error named `TooManyRows`.
   *
   * @param query
   * @param values
   */
  oneOrNone<T>(query: string, values: readonly unknown[]): Promise<T | undefined>;

  /**
   * Execute the provided parametrized SQL query.
   * If the query returns:
   * - 0 rows, then this method throws an error named `ZeroRows`
   * - 1 row, then this method returns this row
   * - 2 or more rows, then this methods throws an Error named `TooManyRows`.
   *
   * @param query
   * @param values
   */
  one(query: string, values: readonly unknown[]): Promise<any>;

  /**
   * Execute the provided parametrized SQL query and assert that it affects exactly one row.
   *
   * @param query
   * @param values
   */
  countOne(query: string, values: readonly unknown[]): Promise<void>;
}

/**
 * Create a complete queryable from the provided simple queryable.
 *
 * @param simple Simple queryable to use
 */
export function deriveQueryable(simple: SimpleQueryable): Queryable {
  return {
    query: async (query: string, values: any[]) => simple.query(query, values),
    oneOrNone: async <R>(query: string, values: any[]): Promise<R | undefined> => oneOrNone<R>(simple, query, values),
    one: async (query: string, values: any[]) => one(simple, query, values),
    countOne: async (query: string, values: any[]) => countOne(simple, query, values),
  };
}

async function oneOrNone<T>(simple: SimpleQueryable, query: string, values: readonly unknown[]): Promise<T | undefined> {
  const result: pg.QueryResult = await simple.query(query, values);

  switch (result.rows.length) {
  case 0:
    return undefined;
  case 1:
    return result.rows[0];
  default:
    throw new Error(`AssertionError: Expected zero or one row, got ${result.rows.length}`);
  }
}

async function one<T>(simple: SimpleQueryable, query: string, values: readonly unknown[]): Promise<T> {
  const result: pg.QueryResult = await simple.query(query, values);
  if (result.rows.length !== 1) {
    throw new Error(`AssertionError: Expected exactly one row, got ${result.rows.length}`);
  }
  return result.rows[0];
}

async function countOne(simple: SimpleQueryable, query: string, values: readonly unknown[]): Promise<void> {
  const result: pg.QueryResult = await simple.query(query, values);
  if (result.rowCount !== 1) {
    throw new Error(`AssertionError: Expected query to only touch row, got ${result.rowCount}`);
  }
}

export interface DbConfig {
  /**
   * Database cluster hostname
   */
  host: string;

  /**
   * Database cluster port
   */
  port: number;

  /**
   * Database name
   */
  name: string;

  /**
   * Database user name
   */
  user: string;

  /**
   * Database user password
   */
  password: string;
}

export class Database implements Queryable {
  private pool: pg.Pool;

  public constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  public static create(options: DbConfig): Database {
    const dbConfig: pg.PoolConfig = {
      host: options.host,
      port: options.port,
      database: options.name,
      user: options.user,
      password: options.password,
      max: 10,
      idleTimeoutMillis: 1000,
    };

    return new Database(new pg.Pool(dbConfig));
  }

  public async query(queryText: string, params: readonly unknown[]): Promise<pg.QueryResult> {
    return this.pool.query(queryText, params as any[]);
  }

  public async oneOrNone<T>(query: string, values: any[]): Promise<T | undefined> {
    return oneOrNone<T>(this.pool, query, values);
  }

  public async one<T>(query: string, values: any[]): Promise<T> {
    const result: T | undefined = await oneOrNone<T>(this.pool, query, values);
    if (result === undefined) {
      throw new Error("Expected exactly one affected row");
    }
    return result;
  }

  public async countOne(query: string, values: any[]): Promise<void> {
    return countOne(this.pool, query, values);
  }

  async withClient<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client: pg.PoolClient = await this.pool.connect();
    let result: T;
    try {
      result = await fn(client);
      client.release();
    } catch (err) {
      client.release(err);
      throw err;
    }
    return result;
  }

  public async transaction<T>(txMode: TransactionMode, handler: TransactionHandler<T>): Promise<T> {
    return new TransactionTask(txMode, handler).apply(this);
  }
}

/**
 * Represents a transaction context. You can perform queries on it.
 */
export interface TransactionContext extends Queryable {
  readonly mode: TransactionMode;
}

export enum TransactionMode {
  ReadWrite,
  ReadOnly,
}

/**
 * Represents a function executed in the context of a transaction.
 */
export type TransactionHandler<T> = (txCx: TransactionContext) => Promise<T>;

/**
 * Represents a task that can be executed in the context of a transaction.
 */
export class TransactionTask<T> {
  /**
   * The mode of the transaction. Indicates if the transaction is read only or not.
   */
  readonly mode: TransactionMode;

  /**
   * The function to call during the transaction.
   * Its result will be the result of the transaction.
   * If it throws an error, the transaction will be rollback' ed.
   */
  readonly handler: TransactionHandler<T>;

  constructor(txMode: TransactionMode, handler: TransactionHandler<T>) {
    this.mode = txMode;
    this.handler = handler;
  }

  /**
   * Executes this transaction task on the provided database.
   *
   * @param db Database object providing clients allowing to do top-level transactions.
   * @return The result of the `handler` function.
   */
  async apply(db: Database): Promise<T> {
    return db.withClient<T>(async (client: pg.ClientBase): Promise<T> => {
      await begin(client, this.mode);
      let result: T;
      try {
        const transactionContext: TransactionContext = createTransactionContext(client, this.mode);
        result = await this.handler(transactionContext);
        await commit(client);
      } catch (err) {
        try {
          await rollback(client);
        } catch (rollbackError) {
          throw new Error(`RollbackFailure: ${util.inspect({rollbackReason: err})}\nCaused by: ${rollbackError.stack}`);
        }
        throw err;
      }
      return result;
    });
  }
}

async function begin(client: pg.ClientBase, transactionMode: TransactionMode): Promise<void> {
  let query: string;
  switch (transactionMode) {
  case TransactionMode.ReadWrite:
    query = "BEGIN READ WRITE;";
    break;
  case TransactionMode.ReadOnly:
    query = "BEGIN READ ONLY;";
    break;
  default:
    throw new Error("AssertionError: Unexpected transaction mode");
  }
  try {
    await client.query(query);
  } catch (err) {
    throw new Error(`BeginTransaction: Unable to begin transaction: ${util.inspect({transactionMode})}\nCaused by: ${err.stack}`);
  }
}

async function commit(client: pg.ClientBase): Promise<void> {
  try {
    await client.query("COMMIT;");
  } catch (err) {
    throw new Error(`CommitTransaction: Unable to commit transaction\nCaused by: ${err.stack}`);
  }
}

async function rollback(client: pg.ClientBase): Promise<void> {
  try {
    await client.query("ROLLBACK;");
  } catch (err) {
    throw new Error(`RollbackTransaction: Unable to rollback transaction\nCaused by: ${err.stack}`);
  }
}

function createTransactionContext(client: pg.ClientBase, transactionMode: TransactionMode): TransactionContext {
  return {...deriveQueryable(client), mode: transactionMode};
}

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
