import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Api, testOauthProviderService } from "@eternal-twin/oauth-provider-test";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { PgOauthProviderService } from "../lib/index.js";

async function withPgOauthProviderService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password,
  };

  return withPgPool(dbConfig, async (pool) => {
    const db = new Database(pool);
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const password = new ScryptPasswordService();
    const oauthProvider = new PgOauthProviderService(db, UUID4_GENERATOR, password, secretKeyStr, secretKeyBytes);
    return fn({oauthProvider});
  });
}

describe("PgAuthService", function () {
  testOauthProviderService(withPgOauthProviderService);
});
