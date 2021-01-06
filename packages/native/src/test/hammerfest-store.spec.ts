import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { Api as HammerfestStoreApi, testHammerfestStore } from "@eternal-twin/hammerfest-store-test";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";

describe("NativeHammerfestStore", function () {
  describe("MemHammerfestStore", function () {
    async function withMemHammerfestStore<R>(fn: (api: HammerfestStoreApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const hammerfestStore = new MemHammerfestStore({clock});
      return fn({hammerfestStore});
    }

    testHammerfestStore(withMemHammerfestStore);
  });

  describe("PgHammerfestStore", function () {
    async function withPgHammerfestStore<R>(fn: (api: HammerfestStoreApi) => Promise<R>): Promise<R> {
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
        const database = await NativeDatabase.create(dbConfig);
        const clock = new SystemClock();
        const hammerfestStore = new PgHammerfestStore({clock, database});
        return fn({hammerfestStore});
      });
    }

    testHammerfestStore(withPgHammerfestStore);
  });
});
