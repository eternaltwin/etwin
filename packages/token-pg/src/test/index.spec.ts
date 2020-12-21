import { PgDinoparcStore } from "@eternal-twin/dinoparc-store-pg";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { PgHammerfestStore } from "@eternal-twin/hammerfest-store-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api, testTokenService } from "@eternal-twin/token-test";

import { PgTokenService } from "../lib/index.js";

async function withPgTokenService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const dbSecretStr: string = config.etwin.secret;
    await forceCreateLatest(db);
    const dinoparcStore = new PgDinoparcStore(db);
    const hammerfestStore = new PgHammerfestStore(db);
    const token = new PgTokenService(db, dbSecretStr, dinoparcStore, hammerfestStore);
    return fn({hammerfestStore, token});
  });
}

describe("PgTokenService", function () {
  testTokenService(withPgTokenService);
});
