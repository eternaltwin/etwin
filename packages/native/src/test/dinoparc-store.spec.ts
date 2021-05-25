import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedDinoparcUser } from "@eternal-twin/core/lib/dinoparc/archived-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemDinoparcStore, PgDinoparcStore } from "../lib/dinoparc-store.js";

describe("NativeDinoparcStore", function () {
  describe("MemDinoparcStore", function () {
    async function withMemDinoparcStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const dinoparcStore = new MemDinoparcStore({clock});
      return fn({dinoparcStore});
    }

    testDinoparcStore(withMemDinoparcStore);
  });

  describe("PgDinoparcStore", function () {
    async function withPgDinoparcStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const config = await getLocalConfig();
      const adminDbConfig: DbConfig = {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
        user: config.db.adminUser,
        password: config.db.adminPassword,
      };
      await withPgPool(adminDbConfig, async (pool) => {
        const database = new Database(pool);
        await forceCreateLatest(database);
      });

      const dbConfig: DbConfig = {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
        user: config.db.user,
        password: config.db.password,
      };

      const nativeDatabase = await NativeDatabase.create(dbConfig);

      const clock = new SystemClock();
      const dinoparcStore = await PgDinoparcStore.create({clock, database: nativeDatabase});
      try {
        return await fn({dinoparcStore});
      } finally {
        await nativeDatabase.close();
      }
    }

    testDinoparcStore(withPgDinoparcStore);
  });
});

interface TestApi {
  dinoparcStore: DinoparcStore;
}

function testDinoparcStore(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Dinoparc user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.dinoparcStore.touchShortUser({type: ObjectType.DinoparcUser, server: "dinoparc.com", id: "123", username: "alice"});

      const actual: ArchivedDinoparcUser | null = await api.dinoparcStore.getShortUser({server: "dinoparc.com", id: "123"});
      {
        const expected: ArchivedDinoparcUser = {
          type: ObjectType.DinoparcUser,
          server: "dinoparc.com",
          id: "123",
          username: "alice",
          archivedAt: actual!.archivedAt,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Dinoparc user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.dinoparcStore.touchShortUser({type: ObjectType.DinoparcUser, server: "dinoparc.com", id: "123", username: "alice"});

      const actual: ArchivedDinoparcUser | null = await api.dinoparcStore.getShortUser({server: "dinoparc.com", id: "999"});
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
