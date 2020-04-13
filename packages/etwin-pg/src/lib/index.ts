import fs from "fs";

import { resolveScriptFuri } from "./scripts.js";

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

export enum DbVersion {
  /**
   * First version: Eternal-Twin users, display names, emails, Hammerfest users
   */
  V001 = "001",
}

export const LATEST_DB_VERSION: DbVersion = DbVersion.V001;

/**
 * Represents a simple queryable object for a database.
 */
export interface Queryable {
  query(query: string): Promise<any>;
}

/**
 * Execute an SQL script.
 *
 * @param queryable Queryable object for the database.
 * @param sqlText The source text of the SQL script.
 */
export async function execSql(queryable: Queryable, sqlText: string): Promise<any> {
  return queryable.query(sqlText);
}

export async function drop(queryable: Queryable): Promise<void> {
  const dropScriptFuri = resolveScriptFuri("drop.sql");
  const dropScript: string = await fs.promises.readFile(dropScriptFuri, {encoding: "utf-8"});
  return execSql(queryable, dropScript);
}

export async function dropAndCreate(queryable: Queryable, version: DbVersion): Promise<void> {
  await drop(queryable);
  await create(queryable, version);
}

async function create(queryable: Queryable, version: DbVersion): Promise<void> {
  const scriptFuri = resolveScriptFuri("create", `${version}.sql`);
  const script: string = await fs.promises.readFile(scriptFuri, {encoding: "utf-8"});
  return execSql(queryable, script);
}
