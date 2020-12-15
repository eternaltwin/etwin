import { getLocalConfig } from "@eternal-twin/local-config";
import { withPgPool } from "@eternal-twin/pg-db";
import pg from "pg";

import { forceCreateLatest, upgradeLatest } from "../lib/index.js";

export async function main() {
  const args: readonly string[] = process.argv.slice(2);
  switch (args[0]) {
    case "create":
      return runCreate();
    case "upgrade":
      return runUpgrade();
    default:
      console.error("Unexpected command: expected `create`, `export`, `import` or `upgrade`");
      process.exit(1);
  }
}

async function runUpgrade() {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await upgradeLatest(pool);
  });
}

async function runCreate() {
  const config = await getLocalConfig();
  return withPgPool(config.db, async (pool: pg.Pool) => {
    await forceCreateLatest(pool);
  });
}

main();
