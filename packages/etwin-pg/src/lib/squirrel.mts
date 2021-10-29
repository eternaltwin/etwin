import { Database, TransactionContext, TransactionMode } from "@eternal-twin/pg-db";
import * as fs from "fs";
import * as furi from "furi";
import { URL } from "url";

export type SchemaVersion = number;
export type SchemaState = number;

interface SchemaMeta {
  version: number;
}

const SQL_NODE_PATTERN: RegExp = /^([0-9]{1,4})\.sql$/;
const SQL_EDGE_PATTERN: RegExp = /^([0-9]{1,4})-([0-9]{1,4})\.sql$/;
const DEFAULT_SCHEMA_COMMENT = "standard public schema";

export enum MigrationDirection {
  UpgradeOnly,
  DowngradeOnly,
}

interface Transition {
  /**
   * SQL script to transition the schema
   */
  schema: string;

  /**
   * SQL script to populate data.
   */
  data: string | null;
}

export interface Migration {
  readonly states: readonly SchemaState[];
}

export class Squirrel {
  readonly #states: ReadonlyMap<SchemaState, null>;
  readonly #transitions: ReadonlyMap<SchemaState, ReadonlyMap<SchemaState, Readonly<Transition>>>;
  readonly #drop: string | null;
  readonly #grant: string | null;
  readonly #latest: SchemaVersion;

  private constructor(
    states: Map<SchemaState, null>,
    transitions: Map<SchemaState, Map<SchemaState, Transition>>,
    drop: string | null,
    grant: string | null,
    latest: SchemaVersion,
  ) {
    this.#states = states;
    this.#transitions = transitions;
    this.#drop = drop;
    this.#grant = grant;
    this.#latest = latest;
  }

  public static async fromDir(dir: URL): Promise<Squirrel> {
    const states: Map<SchemaState, null> = new Map();
    const transitions: Map<SchemaState, Map<SchemaState, Transition>> = new Map();
    let latest: number = 0;

    function addNode(state: SchemaState) {
      states.set(state, null);
    }

    function addEdge(start: SchemaState, end: SchemaState, transition: Transition) {
      let outEdges: Map<SchemaState, Transition> | undefined = transitions.get(start);
      if (outEdges === undefined) {
        outEdges = new Map();
        transitions.set(start, outEdges);
      }
      states.set(start, null);
      states.set(end, null);
      outEdges.set(end, transition);
    }

    addNode(0);
    const createDir = furi.join(dir, "create");
    const createScripts: fs.Dirent[] | null = await tryReadDir(createDir);
    if (createScripts !== null) {
      for (const ent of createScripts) {
        if (!ent.isFile()) {
          continue;
        }
        const match: RegExpExecArray | null = SQL_NODE_PATTERN.exec(ent.name);
        if (match === null) {
          continue;
        }
        const version = parseInt(match[1], 10);
        const schema = await readText(furi.join(createDir, [ent.name]));
        addEdge(0, version, {schema, data: null});
        latest = Math.max(latest, version);
      }
    }
    const upgradeDir = furi.join(dir, "upgrade");
    const upgradeScripts: fs.Dirent[] | null = await tryReadDir(upgradeDir);
    if (upgradeScripts !== null) {
      for (const ent of upgradeScripts) {
        if (!ent.isFile()) {
          continue;
        }
        const match: RegExpExecArray | null = SQL_EDGE_PATTERN.exec(ent.name);
        if (match === null) {
          continue;
        }
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        const schema = await readText(furi.join(upgradeDir, [ent.name]));
        addEdge(start, end, {schema, data: null});
        latest = Math.max(latest, end);
      }
    }
    const drop = await tryReadText(furi.join(dir, "drop.sql"));
    const grant = await tryReadText(furi.join(dir, "grant.sql"));

    return new Squirrel(states, transitions, drop, grant, latest);
  }

  public getEmpty(): SchemaState {
    return 0;
  }

  public getLatest(): SchemaVersion {
    return this.#latest;
  }

  public createMigration(start: SchemaState, end: SchemaState, dir: MigrationDirection): Migration {
    let cost: (start: SchemaState, end: SchemaState) => number;
    switch (dir) {
      case MigrationDirection.UpgradeOnly: {
        cost = (start: SchemaState, end: SchemaState): number => {
          if (start === end) {
            return 0;
          } else {
            return start < end ? 1 : Infinity;
          }
        };
        break;
      }
      case MigrationDirection.DowngradeOnly: {
        cost = (start: SchemaState, end: SchemaState): number => {
          if (start === end) {
            return 0;
          } else {
            return start < end ? Infinity : 1;
          }
        };
        break;
      }
      default: {
        throw new Error(`AssertionError: Unexpected MigrationDirection: ${dir}`);
      }
    }

    const closedSet: Set<SchemaState> = new Set();
    const parents: Map<SchemaState, SchemaState | null> = new Map();
    const costs: Map<SchemaState, number> = new Map();
    parents.set(start, null);
    costs.set(start, 0);

    function getLowest(): SchemaState | null {
      let lowestNode: SchemaState | null = null;
      let lowestCost: number = Infinity;
      for (const [node, cost] of costs) {
        if (closedSet.has(node)) {
          continue;
        }
        if (cost < lowestCost) {
          lowestCost = cost;
          lowestNode = node;
        }
      }
      return lowestNode;
    }

    for(;;) {
      const cur: SchemaState | null = getLowest();
      if (cur === null || cur === end) {
        break;
      }
      const curCost = costs.get(cur) ?? Infinity;
      for (const nextNode of this.#transitions.get(cur)?.keys() ?? []) {
        const newCost = curCost + cost(cur, nextNode);
        const oldCost = costs.get(nextNode) ?? Infinity;
        if (newCost < oldCost) {
          costs.set(nextNode, newCost);
          parents.set(nextNode, cur);
        }
      }
      closedSet.add(cur);
    }

    const path: SchemaState[] = [];
    let cur: SchemaState | null = end;
    while (cur !== null) {
      path.unshift(cur);
      const parent: SchemaState | null | undefined = parents.get(cur);
      if (parent === undefined) {
        throw new Error("AssertionError: Parent not found");
      }
      cur = parent;
    }

    return {states: path};
  }

  public async empty(db: Database): Promise<void> {
    if (this.#drop === null) {
      throw new Error("AssertionError: No drop script");
    }
    // TODO: Transaction?
    await db.query(this.#drop, []);
    if (this.#grant !== null) {
      // TODO: Transaction?
      await db.query(this.#grant, []);
    }
  }

  public async upgrade(queryable: Database, version: SchemaVersion): Promise<void> {
    return this.innerUpgrade(queryable, version);
  }

  public async upgradeLatest(queryable: Database): Promise<void> {
    return this.innerUpgrade(queryable, this.#latest);
  }

  private async innerUpgrade(queryable: Database, version: SchemaVersion): Promise<void> {
    const start = await this.getState(queryable);
    const migration = this.createMigration(start, version, MigrationDirection.UpgradeOnly);
    await this.innerApplyMigration(queryable, migration);
  }

  public async forceCreate(queryable: Database, version: SchemaVersion): Promise<void> {
    return this.innerForceCreate(queryable, version);
  }

  public async forceCreateLatest(queryable: Database): Promise<void> {
    return this.innerForceCreate(queryable, this.#latest);
  }

  private async innerForceCreate(queryable: Database, version: SchemaVersion): Promise<void> {
    const migration = this.createMigration(0, version, MigrationDirection.UpgradeOnly);
    await this.empty(queryable);
    await this.innerApplyMigration(queryable, migration);
  }

  private async innerApplyMigration(queryable: Database, migration: Migration): Promise<void> {
    for (let i = 1; i < migration.states.length; i++) {
      const start = migration.states[i - 1];
      const end = migration.states[i];
      await this.innerApplyTransition(queryable, start, end);
    }
  }

  private async innerApplyTransition(db: Database, start: SchemaState, end: SchemaState): Promise<void> {
    if (!this.#states.has(start)) {
      throw new Error("AssertionError: Invalid start state");
    }
    if (!this.#states.has(end)) {
      throw new Error("AssertionError: Invalid end state");
    }
    const edge = this.#transitions.get(start)?.get(end);
    if (edge === undefined) {
      throw new Error("AssertionError: Invalid transition");
    }

    return db.transaction(
      TransactionMode.ReadWrite,
      async (tx: TransactionContext): Promise<void> => {
        const oldState = await this.innerGetState(tx);
        if (oldState !== start) {
          throw new Error("AssertionError: Incompatible start state");
        }
        await tx.query(edge.schema, []);
        await this.setSchemaMeta(tx, {version: end});
        const newState = await this.innerGetState(tx);
        if (newState !== end) {
          throw new Error("AssertionError: Failed transition");
        }
      }
    );
  }

  public async getState(queryable: Database): Promise<SchemaState> {
    return queryable.transaction(TransactionMode.ReadOnly, (tx) => this.innerGetState(tx));
  }

  private async innerGetState(tx: TransactionContext): Promise<SchemaState> {
    let meta: SchemaMeta | null = await this.innerGetSchemaMetaFromFn(tx);
    if (meta === null) {
      meta = await this.innerGetSchemaMetaFromComment(tx);
    }
    const state: SchemaState = meta === null ? 0 : meta.version;
    if (!this.#states.has(state)) {
      throw new Error(`AssertionError: UnknownDbVersion: ${JSON.stringify(state)}`);
    }
    return state;
  }

  private async innerGetSchemaMetaFromComment(tx: TransactionContext): Promise<SchemaMeta | null> {
    const res = await tx.query(`
    SELECT description AS meta
    FROM   pg_catalog.pg_namespace INNER JOIN pg_catalog.pg_description ON (oid = objoid)
    WHERE  nspname = CURRENT_SCHEMA();
    `, []);
    switch (res.rows.length) {
      case 0: {
        return null;
      }
      case 1: {
        const metaJson = res.rows[0].meta;
        if (metaJson === DEFAULT_SCHEMA_COMMENT) {
          return null;
        }
        const meta = JSON.parse(metaJson);
        const version = meta.version;
        return {version};
      }
      default: {
        throw new Error("AssertionError: Expected 0 or 1 row for DB state query");
      }
    }
  }

  private async innerGetSchemaMetaFromFn(tx: TransactionContext): Promise<SchemaMeta | null> {
    await tx.query("SAVEPOINT try_get_meta;", []);
    try {
      type Row = {version: number};
      const row: Row = await tx.one("SELECT version FROM get_schema_meta();", []);
      await tx.query("RELEASE SAVEPOINT try_get_meta;", []);
      return {version: row.version};
    } catch (e) {
      if ((e as any).code === "42883") {
        await tx.query("ROLLBACK TO SAVEPOINT try_get_meta;", []);
        return null;
      } else {
        await tx.query("RELEASE SAVEPOINT try_get_meta;", []);
        throw e;
      }
    }
  }

  private async setSchemaMeta(tx: TransactionContext, meta: Readonly<SchemaMeta>): Promise<void> {
    const queries: readonly string[] = [
      "DROP FUNCTION IF EXISTS get_schema_meta;",
      "DROP TYPE IF EXISTS schema_meta;",
      "DROP TYPE IF EXISTS raw_schema_meta;",
      "CREATE TYPE raw_schema_meta AS (version int4);",
      "CREATE DOMAIN schema_meta AS raw_schema_meta CHECK ((value).version IS NOT NULL AND (value).version >= 1);",
      `CREATE FUNCTION get_schema_meta() RETURNS schema_meta LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT ROW(${meta.version}); $$;`,
    ];
    for (const query of queries) {
      await tx.query(query, []);
    }
  }
}

async function tryReadDir(dir: URL): Promise<fs.Dirent[] | null> {
  try {
    return await fs.promises.readdir(dir, {withFileTypes: true});
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return null;
    }
    throw e;
  }
}

async function readText(file: URL): Promise<string> {
  return fs.promises.readFile(file, {encoding: "utf-8"});
}

async function tryReadText(file: URL): Promise<string | null> {
  try {
    return await readText(file);
  } catch (e) {
    if ((e as any).code === "ENOENT") {
      return null;
    }
    throw e;
  }
}
