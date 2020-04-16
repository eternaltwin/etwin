import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { InMemoryEmailService } from "@eternal-twin/in-memory-email";
import { JsonEmailTemplateService } from "@eternal-twin/json-email-template";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { ScryptPasswordService } from "@eternal-twin/scrypt-password";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { PgAuthService } from "../lib/index.js";
import { getLocalConfig } from "./config.js";
import { Api, testAuthService } from "./test.js";

async function withPgAuthService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config: DbConfig = await getLocalConfig();

  return withPgPool(config, async (pool) => {
    const db = new Database(pool);
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://twin.eternalfest.net"));
    const password = new ScryptPasswordService();
    const auth = new PgAuthService(db, "dbSecret", UUID4_GENERATOR, password, email, emailTemplate, Uint8Array.from([0, 1, 2, 3]));
    return fn({auth, email});
  });
}

describe("PgAuthService", function () {
  testAuthService(withPgAuthService);
});
