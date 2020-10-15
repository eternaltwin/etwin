import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { PgForumService } from "@eternal-twin/forum-pg";
import { HttpHammerfestClientService } from "@eternal-twin/hammerfest-client-http";
import { InMemoryHammerfestService } from "@eternal-twin/hammerfest-in-memory";
import { ApiType, Config } from "@eternal-twin/local-config";
import { HttpOauthClientService } from "@eternal-twin/oauth-client-http";
import { InMemoryOauthProviderService } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderService } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/lib/client.js";
import { InMemoryUserService } from "@eternal-twin/user-in-memory";
import { PgUserService } from "@eternal-twin/user-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";
import urljoin from "url-join";

export interface Api {
  auth: AuthService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  twinoidClient: TwinoidClientService;
  user: UserService;
}

async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new url.URL(config.etwin.externalUri.toString()));
  const password = new ScryptPasswordService();
  const hammerfestClient = new HttpHammerfestClientService();
  const hammerfest = new InMemoryHammerfestService(hammerfestClient);
  const twinoidClient = new HttpTwinoidClientService();

  let auth: AuthService;
  let forum: ForumService;
  let user: UserService;
  let oauthProvider: OauthProviderService;
  let teardown: () => Promise<void>;

  if (config.etwin.api === ApiType.InMemory) {
    const imUser: InMemoryUserService = new InMemoryUserService(UUID4_GENERATOR);
    user = imUser;
    const imOauthProvider = new InMemoryOauthProviderService(UUID4_GENERATOR, password, secretKeyBytes);
    oauthProvider = imOauthProvider;
    auth = new InMemoryAuthService(UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfestClient, twinoidClient, imUser, imOauthProvider);
    forum = new InMemoryForumService(UUID4_GENERATOR, user, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});
    teardown = async function(): Promise<void> {};
  } else {
    const {pool, teardown: teardownPool} = createPgPool({
      host: config.db.host,
      port: config.db.port,
      name: config.db.name,
      user: config.db.user,
      password: config.db.password,
    });
    const db = new Database(pool);
    user = new PgUserService(db, secretKeyStr);
    auth = new PgAuthService(db, secretKeyStr, UUID4_GENERATOR, password, email, emailTemplate, secretKeyBytes, hammerfestClient, twinoidClient);
    oauthProvider = new PgOauthProviderService(db, UUID4_GENERATOR, password, secretKeyStr, secretKeyBytes);
    forum = new PgForumService(db, UUID4_GENERATOR, user, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});
    teardown = async function(): Promise<void> {
      await teardownPool();
    };
  }

  const koaAuth = new KoaAuth(auth);
  const oauthClient = new HttpOauthClientService(
    new url.URL("https://twinoid.com/oauth/auth"),
    new url.URL("https://twinoid.com/oauth/token"),
    config.auth.twinoid.clientId,
    config.auth.twinoid.secret,
    new url.URL(urljoin(config.etwin.externalUri.toString(), "oauth/callback")),
    secretKeyBytes,
  );

  for (const [key, client] of config.clients) {
    await oauthProvider.createOrUpdateSystemClient(
      key,
      {
        displayName: client.displayName,
        appUri: client.appUri.toString(),
        callbackUri: client.callbackUri.toString(),
        secret: Buffer.from(client.secret),
      }
    );
  }

  for (const [key, section] of config.forum.sections) {
    await forum.createOrUpdateSystemSection(
      key,
      {
        displayName: section.displayName,
        locale: section.locale,
      },
    );
  }

  const api: Api = {auth, forum, hammerfest, koaAuth, oauthClient, oauthProvider, twinoidClient, user};

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
