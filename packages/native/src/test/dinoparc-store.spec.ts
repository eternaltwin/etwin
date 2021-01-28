import { Api as DinoparcStoreApi, testDinoparcStore } from "@eternal-twin/dinoparc-store-test";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemDinoparcStore, PgDinoparcStore } from "../lib/dinoparc-store.js";

describe("NativeDinoparcStore", function () {
  describe("MemDinoparcStore", function () {
    async function withMemDinoparcStore<R>(fn: (api: DinoparcStoreApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const dinoparcStore = new MemDinoparcStore({clock});
      return fn({dinoparcStore});
    }

    testDinoparcStore(withMemDinoparcStore);
  });

  describe("PgDinoparcStore", function () {
    async function withPgDinoparcStore<R>(fn: (api: DinoparcStoreApi) => Promise<R>): Promise<R> {
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
        const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
        return fn({dinoparcStore});
      });
    }

    testDinoparcStore(withPgDinoparcStore);
  });
});
