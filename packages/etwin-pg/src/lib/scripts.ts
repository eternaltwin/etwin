import fs from "fs";
import furi from "furi";
import url from "url";

import { DbVersion, execSql, Queryable } from "./index.js";

const PROJECT_ROOT: url.URL = furi.join(import.meta.url, "..", "..");

export function resolveScriptFuri(...components: readonly string[]): url.URL {
  return furi.join(PROJECT_ROOT, "scripts", ...components);
}

function resolveCreateScript(version: DbVersion): url.URL {
  return resolveScriptFuri("create", `${version}.sql`);
}

function resolveUpgradeScript(startVersion: DbVersion, endVersion: DbVersion): url.URL {
  return resolveScriptFuri("upgrade", `${startVersion}-${endVersion}.sql`);
}

async function readCreateScript(version: DbVersion): Promise<string> {
  const scriptFuri: url.URL = resolveCreateScript(version);
  return await fs.promises.readFile(scriptFuri, {encoding: "utf-8"});
}

async function readUpgradeScript(startVersion: DbVersion, endVersion: DbVersion): Promise<string> {
  const scriptFuri: url.URL = resolveUpgradeScript(startVersion, endVersion);
  return await fs.promises.readFile(scriptFuri, {encoding: "utf-8"});
}

export async function create1(queryable: Queryable, _isVoid: boolean): Promise<void> {
  const script: string = await readCreateScript(DbVersion.V001);
  return execSql(queryable, script);
}

export async function create2(queryable: Queryable, isVoid: boolean): Promise<void> {
  await create1(queryable, isVoid);
  await upgrade1to2(queryable, isVoid);
}

export async function upgrade1to2(queryable: Queryable, _isVoid: boolean): Promise<void> {
  const script: string = await readUpgradeScript(DbVersion.V001, DbVersion.V002);
  return execSql(queryable, script);
}
