import { forceCreateLatest, getState, upgradeLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import pg from "pg";

export async function runDb(args: readonly string[]): Promise<number> {
  switch (args[0]) {
    case "check":
      await runCheck();
      break;
    case "create":
      await runCreate();
      break;
    case "upgrade":
      await runUpgrade();
      break;
    default:
      console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
      return 1;
  }
  return 0;
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
