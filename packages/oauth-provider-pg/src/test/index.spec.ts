import { VirtualClockService } from "@eternal-twin/core/lib/clock/virtual.js";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Api, testOauthProviderStore } from "@eternal-twin/oauth-provider-test";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { PgOauthProviderStore } from "../lib/index.js";

async function withPgOauthProviderStore<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password,
  };

  return withPgPool(dbConfig, async (pool) => {
    const database = new Database(pool);
    await forceCreateLatest(database);
    const secretKeyStr: string = config.etwin.secret;
    const password = new ScryptPasswordService();
    const uuidGenerator = UUID4_GENERATOR;
    const clock = new VirtualClockService(new Date("2020-10-22T19:28:22.976Z"));
    const oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    return fn({clock, oauthProviderStore});
  });
}

describe("PgOauthProviderStore", function () {
  testOauthProviderStore(withPgOauthProviderStore);
});
