import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { InMemoryEmailService } from "@eternal-twin/in-memory-email";
import { JsonEmailTemplateService } from "@eternal-twin/json-email-template";
import { getLocalConfig } from "@eternal-twin/local-config";
import { PgAuthService } from "@eternal-twin/pg-auth";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { ScryptPasswordService } from "@eternal-twin/scrypt-password";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { PgUserService } from "../lib/index.js";
import { Api, testAuthService } from "./test.js";

async function withPgAuthService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig(["dbHost", "dbPort", "dbName", "dbUser", "dbPassword", "secretKey"]);
  const dbConfig: DbConfig = {
    host: config.dbHost,
    port: config.dbPort,
    name: config.dbName,
    user: config.dbUser,
    password: config.dbPassword
  };

  return withPgPool(dbConfig, async (pool) => {
    const db = new Database(pool);
    const secretKeyStr: string = config.secretKey;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://twin.eternalfest.net"));
    const password = new ScryptPasswordService();
    const user = new PgUserService(db, secretKeyStr);
    const auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes);
    return fn({auth, user});
  });
}

describe("PgAuthService", function () {
  testAuthService(withPgAuthService);
});
