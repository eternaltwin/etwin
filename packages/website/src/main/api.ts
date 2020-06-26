import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { PgForumService } from "@eternal-twin/forum-pg";
import { HttpHammerfestService } from "@eternal-twin/hammerfest-http";
import { HttpOauthClientService, OauthClientService } from "@eternal-twin/oauth-client-http";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderService } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { InMemoryUserService } from "@eternal-twin/user-in-memory";
import { PgUserService } from "@eternal-twin/user-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";
import urljoin from "url-join";

import { Config } from "./config.js";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  forum: ForumService;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  user: UserService;
}

async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const secretKeyStr: string = config.secretKey;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new url.URL(config.externalBaseUri.toString()));
  const password = new ScryptPasswordService();
  const hammerfest = new HttpHammerfestService();

  let auth: AuthService;
  let forum: ForumService;
  let user: UserService;
  let oauthProvider: OauthProviderService;
  let teardown: () => Promise<void>;

  if (config.inMemory) {
    const imUser: InMemoryUserService = new InMemoryUserService(UUID4_GENERATOR);
    user = imUser;
    const imOauthProvider = new InMemoryOauthProviderService(UUID4_GENERATOR, password, secretKeyBytes);
    oauthProvider = imOauthProvider;
    auth = new InMemoryAuthService(UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest, imUser, imOauthProvider);
    forum = new InMemoryForumService(UUID4_GENERATOR, user);
    teardown = async function(): Promise<void> {};
  } else {
    const {pool, teardown: teardownPool} = createPgPool({
      host: config.dbHost,
      port: config.dbPort,
      name: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
    });
    const db = new Database(pool);
    user = new PgUserService(db, secretKeyStr);
    auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfest);
    oauthProvider = new PgOauthProviderService(db, UUID4_GENERATOR, password, secretKeyStr, secretKeyBytes);
    forum = new PgForumService(db, UUID4_GENERATOR, user, 20);
    teardown = async function(): Promise<void> {
      await teardownPool();
    };
  }

  const koaAuth = new KoaAuth(auth);
  const oauthCallbackUri: url.URL = new url.URL(urljoin(config.externalBaseUri.toString(), "oauth/callback"));
  const oauthClient = new HttpOauthClientService(config.twinoidOauthClientId, config.twinoidOauthSecret, oauthCallbackUri);

  await oauthProvider.createOrUpdateSystemClient(
    "eternalfest",
    {
      displayName: "Eternalfest",
      appUri: config.eternalfestAppUri.toString(),
      callbackUri: config.eternalfestCallbackUri.toString(),
      secret: Buffer.from(config.eternalfestSecret),
    }
  );

  const api: Api = {auth, koaAuth, forum, oauthClient, oauthProvider, user};

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
