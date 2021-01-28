import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api as UserStoreApi, testUserService } from "@eternal-twin/user-store-test";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemUserStore, PgUserStore } from "../lib/user-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeUserStore", function () {
  describe("MemUserStore", function () {
    async function withMemUserStore<R>(fn: (api: UserStoreApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const uuidGenerator = new Uuid4Generator();
      const userStore = new MemUserStore({clock, uuidGenerator});
      return fn({clock, userStore});
    }

    testUserService(withMemUserStore);
  });

  describe("PgUserStore", function () {
    async function withPgUserStore<R>(fn: (api: UserStoreApi) => Promise<R>): Promise<R> {
      const config = await getLocalConfig();
      const dbConfig: DbConfig = {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
        user: config.db.user,
        password: config.db.password
      };
      const secretKeyStr: string = config.etwin.secret;

      return withPgPool(dbConfig, async (pool) => {
        const db = new Database(pool);
        await forceCreateLatest(db);
        const nativeDatabase = await NativeDatabase.create(dbConfig);
        const clock = new SystemClock();
        const uuidGenerator = new Uuid4Generator();
        const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        return fn({clock, userStore});
      });
    }

    testUserService(withPgUserStore);
  });
});
