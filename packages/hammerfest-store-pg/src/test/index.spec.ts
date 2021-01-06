import { Api, testHammerfestStore } from "@eternal-twin/hammerfest-store-test";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { PgHammerfestStore } from "../lib/index.js";

async function withPgHammerfestStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password
  };

  return withPgPool(dbConfig, async (pool) => {
    const db = new Database(pool);
    const hammerfestStore = new PgHammerfestStore(db);
    return fn({hammerfestStore});
  });
}

describe("PgHammerfestStore", function () {
  testHammerfestStore(withPgHammerfestStore);
});
