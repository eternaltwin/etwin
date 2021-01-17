import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid.js";
import { Api, testOauthProviderStore } from "@eternal-twin/oauth-provider-test";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

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
    const uuidGenerator = new Uuid4Generator();
    const clock = new VirtualClock();
    const oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    return fn({clock, oauthProviderStore});
  });
}

describe("PgOauthProviderStore", function () {
  testOauthProviderStore(withPgOauthProviderStore);
});
