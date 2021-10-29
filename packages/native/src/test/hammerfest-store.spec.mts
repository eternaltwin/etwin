import { ObjectType } from "@eternal-twin/core/core/object-type";
import { ArchivedHammerfestUser } from "@eternal-twin/core/hammerfest/archived-hammerfest-user";
import { HammerfestStore } from "@eternal-twin/core/hammerfest/store";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.mjs";
import { Database as NativeDatabase } from "../lib/database.mjs";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.mjs";
import { Uuid4Generator } from "../lib/uuid.mjs";

describe("NativeHammerfestStore", function () {
  describe("MemHammerfestStore", function () {
    async function withMemHammerfestStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const hammerfestStore = new MemHammerfestStore({clock});
      return fn({hammerfestStore});
    }

    testHammerfestStore(withMemHammerfestStore);
  });

  describe("PgHammerfestStore", function () {
    async function withPgHammerfestStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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
      const uuidGenerator = new Uuid4Generator();
      const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: config.etwin.secret, uuidGenerator});
      try {
        return await fn({hammerfestStore});
      } finally {
        await nativeDatabase.close();
      }
    }

    testHammerfestStore(withPgHammerfestStore);
  });
});

interface TestApi {
  hammerfestStore: HammerfestStore;
}

function testHammerfestStore(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: ArchivedHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "123"});
      {
        const expected: ArchivedHammerfestUser = {
          type: ObjectType.HammerfestUser,
          server: "hammerfest.fr",
          id: "123",
          username: "alice",
          archivedAt: actual!.archivedAt,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: ArchivedHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "999"});
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
