import { Api, testDinoparcStore } from "@eternal-twin/dinoparc-store-test";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { PgDinoparcStore } from "../lib/index.js";

async function withPgDinoparcStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const dinoparcStore = new PgDinoparcStore(db);
    return fn({dinoparcStore});
  });
}

describe("PgDinoparcStore", function () {
  testDinoparcStore(withPgDinoparcStore);
});
