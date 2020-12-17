import { PgAuthService } from "@eternal-twin/auth-pg";
import { SystemClockService } from "@eternal-twin/core/lib/clock/system.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { HttpDinoparcClientService } from "@eternal-twin/dinoparc-client-http";
import { PgDinoparcStore } from "@eternal-twin/dinoparc-store-pg";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { PgForumService } from "@eternal-twin/forum-pg";
import { PgHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-pg";
import { HttpHammerfestClientService } from "@eternal-twin/hammerfest-client-http";
import { PgLinkService } from "@eternal-twin/link-pg";
import { Config } from "@eternal-twin/local-config";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { PgSimpleUserService } from "@eternal-twin/simple-user-pg";
import { PgTokenService } from "@eternal-twin/token-pg";
import { PgTwinoidArchiveService } from "@eternal-twin/twinoid-archive-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";

import { KoaAuth } from "../lib/helpers/koa-auth.js";
import { Api } from "../lib/index.js";

export async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const {pool, teardown: teardownPool} = createPgPool({
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password,
  });

  const clock = new SystemClockService();
  const uuidGenerator = UUID4_GENERATOR;
  const database = new Database(pool);
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(config.etwin.externalUri);
  const password = new ScryptPasswordService();
  const simpleUser = new PgSimpleUserService({database, databaseSecret: secretKeyStr, uuidGenerator});
  const dinoparcClient = new HttpDinoparcClientService();
  const dinoparcStore = new PgDinoparcStore(database);
  const hammerfestArchive = new PgHammerfestArchiveService(database);
  const hammerfestClient = new HttpHammerfestClientService();
  const twinoidArchive = new PgTwinoidArchiveService(database);
  const twinoidClient = new HttpTwinoidClientService();
  const link = new PgLinkService({database, dinoparcStore, hammerfestArchive, twinoidArchive, user: simpleUser});
  const oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
  const oauthProvider = new OauthProviderService({clock, oauthProviderStore, simpleUser, tokenSecret: secretKeyBytes, uuidGenerator});
  const auth = new PgAuthService({database, databaseSecret: secretKeyStr, email, emailTemplate, hammerfestArchive, hammerfestClient, link, oauthProvider, password, simpleUser, tokenSecret: secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator});
  const koaAuth = new KoaAuth(auth);
  const forum = new PgForumService(database, uuidGenerator, simpleUser, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});
  const token = new PgTokenService(database, secretKeyStr, dinoparcStore, hammerfestArchive);
  const dinoparc = new DinoparcService({dinoparcStore, link});
  const hammerfest = new HammerfestService({hammerfestArchive, hammerfestClient, link});
  const user = new UserService({auth, dinoparcClient, dinoparcStore, hammerfestArchive, hammerfestClient, link, simpleUser, token, twinoidArchive, twinoidClient});

  for (const [key, section] of config.forum.sections) {
    await forum.createOrUpdateSystemSection(
      key,
      {
        displayName: section.displayName,
        locale: section.locale,
      },
    );
  }

  const api: Api = {auth, dinoparc, forum, hammerfest, koaAuth, user};

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
