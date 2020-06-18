import { PgAuthService } from "@eternal-twin/auth-pg";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { Api, testForumService } from "@eternal-twin/forum-test";
import { InMemoryHammerfestService } from "@eternal-twin/hammerfest-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { PgUserService } from "@eternal-twin/user-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { PgForumService } from "../lib/index.js";

async function withPgForumService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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
    const hammerfest = new InMemoryHammerfestService();
    const auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest);
    const forum = new PgForumService(db, UUID4_GENERATOR, user);
    return fn({auth, forum});
  });
}

describe("PgAuthService", function () {
  testForumService(withPgForumService);
});
