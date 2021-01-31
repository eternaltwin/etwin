import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api as TwinoidStoreApi, testTwinoidStore } from "@eternal-twin/twinoid-store-test";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemTwinoidStore, PgTwinoidStore } from "../lib/twinoid-store.js";

describe("NativeTwinoidStore", function () {
  describe("MemTwinoidStore", function () {
    async function withMemTwinoidStore<R>(fn: (api: TwinoidStoreApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const twinoidStore = new MemTwinoidStore({clock});
      return fn({twinoidStore});
    }

    testTwinoidStore(withMemTwinoidStore);
  });

  describe("PgTwinoidStore", function () {
    async function withPgTwinoidStore<R>(fn: (api: TwinoidStoreApi) => Promise<R>): Promise<R> {
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
        await forceCreateLatest(db);
        const nativeDatabase = await NativeDatabase.create(dbConfig);
        const clock = new SystemClock();
        const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
        return fn({twinoidStore});
      });
    }

    testTwinoidStore(withPgTwinoidStore);
  });
});
