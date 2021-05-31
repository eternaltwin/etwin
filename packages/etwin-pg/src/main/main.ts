import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import pg from "pg";

import { forceCreateLatest, getState, upgradeLatest } from "../lib/index.js";

export async function main() {
  const args: readonly string[] = process.argv.slice(2);
  switch (args[0]) {
    case "check":
      return runCheck();
    case "create":
      return runCreate();
    case "upgrade":
      return runUpgrade();
    default:
      console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
      process.exit(1);
  }
}

async function runCheck() {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    const db = new Database(pool);
    const state = await getState(db);
    if (state === 0) {
      console.log("Empty database");
    } else {
      console.log(`Database state: ${state}`);
    }
  });
}

async function runCreate() {
  const config = await getLocalConfig();
  const dbConf: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.adminUser,
    password: config.db.adminPassword,
  };
  return withPgPool(dbConf, async (pool: pg.Pool) => {
    const db = new Database(pool);
    await forceCreateLatest(db);
  });
}

async function runUpgrade() {
  const config = await getLocalConfig();
  const dbConf: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.adminUser,
    password: config.db.adminPassword,
  };
  return withPgPool(dbConf, async (pool: pg.Pool) => {
    const db = new Database(pool);
    await upgradeLatest(db);
  });
}

main();
