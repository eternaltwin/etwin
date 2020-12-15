import * as furi from "furi";

import { SchemaState, Squirrel } from "./squirrel.js";

const SCRIPTS_DIR = furi.join(import.meta.url, "../../scripts");

let SQUIRREL: Promise<Squirrel> | undefined;

async function getSquirrel(): Promise<Squirrel> {
  if (SQUIRREL === undefined) {
    SQUIRREL = Squirrel.fromDir(SCRIPTS_DIR);
  }
  return SQUIRREL;
}

/**
 * Represents a simple queryable object for a database.
 */
export interface Queryable {
  query(query: string, values: readonly unknown[]): Promise<any>;
}

export async function getState(queryable: Queryable): Promise<SchemaState> {
  const squirrel = await getSquirrel();
  return squirrel.getState(queryable);
}

export async function empty(queryable: Queryable): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.empty(queryable);
}

export async function forceCreateLatest(queryable: Queryable): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.forceCreateLatest(queryable);
}

export async function forceCreate(queryable: Queryable, state: SchemaState): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.forceCreate(queryable, state);
}

export async function upgrade(queryable: Queryable, state: SchemaState): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.upgrade(queryable, state);
}

export async function upgradeLatest(queryable: Queryable): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.upgradeLatest(queryable);
}
