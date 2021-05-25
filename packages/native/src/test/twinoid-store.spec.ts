import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedTwinoidUser } from "@eternal-twin/core/lib/twinoid/archived-twinoid-user";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemTwinoidStore, PgTwinoidStore } from "../lib/twinoid-store.js";

describe("NativeTwinoidStore", function () {
  describe("MemTwinoidStore", function () {
    async function withMemTwinoidStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const twinoidStore = new MemTwinoidStore({clock});
      return fn({twinoidStore});
    }

    testTwinoidStore(withMemTwinoidStore);
  });

  describe("PgTwinoidStore", function () {
    async function withPgTwinoidStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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
      const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
      try {
        return await fn({twinoidStore});
      } finally {
        await nativeDatabase.close();
      }
    }

    testTwinoidStore(withPgTwinoidStore);
  });
});

interface TestApi {
  twinoidStore: TwinoidStore;
}

function testTwinoidStore(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: ArchivedTwinoidUser | null = await api.twinoidStore.getUser({id: "123"});
        const expected: ArchivedTwinoidUser = {
          type: ObjectType.TwinoidUser,
          id: "123",
          displayName: "alice",
          archivedAt: actual!.archivedAt,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: ArchivedTwinoidUser | null = await api.twinoidStore.getUser({id: "9999999"});
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
