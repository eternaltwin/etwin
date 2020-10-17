import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import { Api, testHammerfestService } from "@eternal-twin/hammerfest-test";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { PgHammerfestService } from "../lib/index.js";

async function withPgHammerfestService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const hammerfestClient = new InMemoryHammerfestClientService();
    const hammerfest = new PgHammerfestService(db);
    return fn({hammerfest, hammerfestClient});
  });
}

describe("PgHammerfestService", function () {
  testHammerfestService(withPgHammerfestService);
});
