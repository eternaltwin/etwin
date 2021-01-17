import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api, testUserService } from "@eternal-twin/user-store-test";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { PgUserStore } from "../lib/index.js";

async function withPgUserStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    await forceCreateLatest(database);

    const clock = new VirtualClock();
    const uuidGenerator = UUID4_GENERATOR;
    const secretKeyStr: string = config.etwin.secret;
    const userStore = new PgUserStore({clock, database, databaseSecret: secretKeyStr, uuidGenerator});
    return fn({clock, userStore});
  });
}

describe("PgUserStore", function () {
  testUserService(withPgUserStore);
});
