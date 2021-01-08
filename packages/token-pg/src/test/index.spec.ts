import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { SystemClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
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
    const database = new Database(pool);
    const nativeDatabase = await NativeDatabase.create(dbConfig);
    await forceCreateLatest(database);

    const dbSecretStr: string = config.etwin.secret;
    const clock = new SystemClock();
    const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
    const hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
    const token = new PgTokenService(database, dbSecretStr, dinoparcStore, hammerfestStore);
    return fn({hammerfestStore, token});
  });
}

describe("PgTokenService", function () {
  testTokenService(withPgTokenService);
});
