import { getLocalConfig } from "@eternal-twin/local-config";
import { withPgPool } from "@eternal-twin/pg-db";
import pg from "pg";

import { DbVersion, dropAndCreate, LATEST_DB_VERSION, upgrade } from "../lib/index.js";

export async function main() {
  const args: readonly string[] = process.argv.slice(2);
  switch (args[0]) {
    case "create":
      return runCreate(LATEST_DB_VERSION);
    case "upgrade":
      return runUpgrade(LATEST_DB_VERSION);
    default:
      console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
      process.exit(1);
  }
}

async function runUpgrade(version: DbVersion) {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await upgrade(pool, version);
  });
}

async function runCreate(version: DbVersion) {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await dropAndCreate(pool, version);
  });
}

main();
