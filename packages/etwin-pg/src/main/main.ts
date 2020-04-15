import { withPgPool } from "@eternal-twin/pg-db";
import pg from "pg";

import { DbVersion, dropAndCreate, LATEST_DB_VERSION } from "../lib/index.js";
import { getLocalConfig } from "./config.js";

export async function main() {
  const args: readonly string[] = process.argv.slice(2);
  switch (args[0]) {
  case "create":
    return runCreate(LATEST_DB_VERSION);
  default:
    console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
    process.exit(1);
  }
}

async function runCreate(version: DbVersion) {
  const config = await getLocalConfig();
  return withPgPool(config, async (pool: pg.Pool) => {
    await dropAndCreate(pool, version);
  });
}

main();
