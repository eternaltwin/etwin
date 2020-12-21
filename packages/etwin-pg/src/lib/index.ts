import { Database, Queryable } from "@eternal-twin/pg-db";
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
export { Queryable };

export async function getState(queryable: Queryable): Promise<SchemaState> {
  const squirrel = await getSquirrel();
  return squirrel.getState(queryable);
}

export async function empty(queryable: Database): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.empty(queryable);
}

export async function forceCreateLatest(queryable: Database): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.forceCreateLatest(queryable);
}

export async function forceCreate(queryable: Database, state: SchemaState): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.forceCreate(queryable, state);
}

export async function upgrade(queryable: Database, state: SchemaState): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.upgrade(queryable, state);
}

export async function upgradeLatest(queryable: Database): Promise<void> {
  const squirrel = await getSquirrel();
  return squirrel.upgradeLatest(queryable);
}
