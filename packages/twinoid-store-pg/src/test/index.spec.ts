import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api, testTwinoidStore } from "@eternal-twin/twinoid-store-test";

import { PgTwinoidStore } from "../lib/index.js";

async function withPgTwinoidStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const twinoidStore = new PgTwinoidStore(db);
    return fn({twinoidStore});
  });
}

describe("PgTwinoidStore", function () {
  testTwinoidStore(withPgTwinoidStore);
});
