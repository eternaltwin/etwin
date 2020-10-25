import { PgAuthService } from "@eternal-twin/auth-pg";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { dropAndCreate, LATEST_DB_VERSION } from "@eternal-twin/etwin-pg/lib/index.js";
import { Api, testForumService } from "@eternal-twin/forum-test";
import { PgHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-pg";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import { PgLinkService } from "@eternal-twin/link-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { PgSimpleUserService } from "@eternal-twin/simple-user-pg";
import { PgTwinoidArchiveService } from "@eternal-twin/twinoid-archive-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { PgForumService } from "../lib/index.js";

async function withPgForumService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password
  };

  return withPgPool(dbConfig, async (pool) => {
    const uuidGenerator = UUID4_GENERATOR;
    const db = new Database(pool);
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    await dropAndCreate(db as any, LATEST_DB_VERSION);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
    const password = new ScryptPasswordService();
    const simpleUser = new PgSimpleUserService({database: db, databaseSecret: secretKeyStr, uuidGenerator});
    const hammerfestArchive = new PgHammerfestArchiveService(db);
    const twinoidArchive = new PgTwinoidArchiveService(db);
    const link = new PgLinkService(db, hammerfestArchive, twinoidArchive, simpleUser);
    const hammerfestClient = new InMemoryHammerfestClientService();
    const twinoidClient = new HttpTwinoidClientService();
    const auth = new PgAuthService(db, secretKeyStr, email, emailTemplate, hammerfestArchive, hammerfestClient, link, password, simpleUser, secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator);
    const forum = new PgForumService(db, UUID4_GENERATOR, simpleUser, {postsPerPage: 10, threadsPerPage: 20});
    return fn({auth, forum});
  });
}

describe("PgForumService", function () {
  testForumService(withPgForumService);
});
