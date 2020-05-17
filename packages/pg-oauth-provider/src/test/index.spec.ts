import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { ScryptPasswordService } from "@eternal-twin/scrypt-password";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { PgOauthProviderService } from "../lib/index.js";
import { Api, testOauthProviderService } from "./test.js";

async function withPgOauthProviderService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig(["dbHost", "dbPort", "dbName", "dbUser", "dbPassword", "secretKey"]);
  const dbConfig: DbConfig = {
    host: config.dbHost,
    port: config.dbPort,
    name: config.dbName,
    user: config.dbUser,
    password: config.dbPassword,
  };

  return withPgPool(dbConfig, async (pool) => {
    const db = new Database(pool);
    const secretKeyStr: string = config.secretKey;
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
