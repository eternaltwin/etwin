import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedHammerfestUser } from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

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
        const uuidGenerator = new Uuid4Generator();
        const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: config.etwin.secret, uuidGenerator});
        try {
          return await fn({hammerfestStore});
        } finally {
          await nativeDatabase.close();
        }
      });
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
