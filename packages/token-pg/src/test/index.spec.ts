import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { SystemClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { PgTwinoidStore } from "@eternal-twin/native/lib/twinoid-store.js";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid.js";
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

    const databaseSecret: string = config.etwin.secret;
    const clock = new SystemClock();
    const uuidGenerator = new Uuid4Generator();
    const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
    const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret, uuidGenerator});
    const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
    const token = new PgTokenService(database, databaseSecret, dinoparcStore, hammerfestStore);
    return fn({hammerfestStore, token, twinoidStore});
  });
}

describe("PgTokenService", function () {
  testTokenService(withPgTokenService);
});
