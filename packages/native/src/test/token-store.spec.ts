import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { Api as TestApi,testTokenService } from "@eternal-twin/token-test";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { MemTokenStore, PgTokenStore } from "../lib/token-store.js";
import { MemTwinoidStore, PgTwinoidStore } from "../lib/twinoid-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeTokenStore", function () {
  describe("MemTokenStore", function () {
    async function withMemTokenStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const hammerfestStore = new MemHammerfestStore({clock});
      const twinoidStore = new MemTwinoidStore({clock});
      const token = new MemTokenStore({clock});
      return fn({hammerfestStore, twinoidStore, token});
    }

    testTokenService(withMemTokenStore);
  });

  describe("PgTokenStore", function () {
    async function withPgLinkStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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
        const nativeDatabase = await NativeDatabase.create(dbConfig);
        const clock = new SystemClock();
        const uuidGenerator = new Uuid4Generator();
        const secretKeyStr: string = config.etwin.secret;
        const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
        const token = await PgTokenStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr});
        try {
          return await fn({hammerfestStore, twinoidStore, token});
        } finally {
          await nativeDatabase.close();
        }
      });
    }

    testTokenService(withPgLinkStore);
  });
});
