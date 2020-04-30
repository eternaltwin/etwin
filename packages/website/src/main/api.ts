import { ConsoleEmailService } from "@eternal-twin/console-email";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { InMemoryAnnouncementService } from "@eternal-twin/etwin-api-in-memory/lib/announcement/service.js";
import { EtwinEmailTemplateService } from "@eternal-twin/etwin-email-template";
import { HttpHammerfestService } from "@eternal-twin/http-hammerfest";
import { PgAuthService } from "@eternal-twin/pg-auth";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { PgUserService } from "@eternal-twin/pg-user";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { ScryptPasswordService } from "@eternal-twin/scrypt-password";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { Config } from "./config.js";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  koaAuth: KoaAuth;
  user: UserService;
}

async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const {pool, teardown: teardownPool} = createPgPool({
    host: config.dbHost,
    port: config.dbPort,
    name: config.dbName,
    user: config.dbUser,
    password: config.dbPassword,
  });

  const db = new Database(pool);
  const secretKeyStr: string = config.secretKey;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new url.URL("https://twin.eternalfest.net"));
  const password = new ScryptPasswordService();
  const hammerfest = new HttpHammerfestService();
  const user = new PgUserService(db, secretKeyStr);
  const auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest);
  const koaAuth = new KoaAuth(auth);
  const announcement = new InMemoryAnnouncementService(UUID4_GENERATOR);

  const api: Api = {auth, announcement, koaAuth, user};

  async function teardown(): Promise<void> {
    await teardownPool();
  }

  return {api, teardown};
}

/**
 * Async resource manager for the Eternalfest API backend.
 *
 * @param config Server config
 * @param fn Inner function to call with an API pool.
 */
export async function withApi<R>(config: Readonly<Config>, fn: (api: Api) => Promise<R>): Promise<R> {
  const {api, teardown} = await createApi(config);
  try {
    return await fn(api);
  } finally {
    await teardown();
  }
}
