import { Api as DinoparcStoreApi, testDinoparcStore } from "@eternal-twin/dinoparc-store-test";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database as NodeDb, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { Database, MemDinoparcStore, PgDinoparcStore, SystemClock } from "../lib/index.js";

describe("EtwinNative", function () {
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
        const db = new NodeDb(pool);
        await forceCreateLatest(db);
        const database = await Database.create(dbConfig);
        const clock = new SystemClock();
        const dinoparcStore = new PgDinoparcStore({clock, database});
        return fn({dinoparcStore});
      });
    }

    testDinoparcStore(withPgDinoparcStore);
  });
});
