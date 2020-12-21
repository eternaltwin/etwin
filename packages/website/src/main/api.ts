import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { SystemClockService } from "@eternal-twin/core/lib/clock/system.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { HttpDinoparcClientService } from "@eternal-twin/dinoparc-client-http";
import { MemDinoparcStore } from "@eternal-twin/dinoparc-store-mem";
import { PgDinoparcStore } from "@eternal-twin/dinoparc-store-pg";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { PgForumService } from "@eternal-twin/forum-pg";
import { InMemoryHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-in-memory";
import { PgHammerfestArchiveService } from "@eternal-twin/hammerfest-archive-pg";
import { HttpHammerfestClientService } from "@eternal-twin/hammerfest-client-http";
import { InMemoryLinkService } from "@eternal-twin/link-in-memory";
import { PgLinkService } from "@eternal-twin/link-pg";
import { ApiType, Config } from "@eternal-twin/local-config";
import { HttpOauthClientService } from "@eternal-twin/oauth-client-http";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { InMemoryTokenService } from "@eternal-twin/token-in-memory";
import { PgTokenService } from "@eternal-twin/token-pg";
import { InMemoryTwinoidArchiveService } from "@eternal-twin/twinoid-archive-in-memory";
import { PgTwinoidArchiveService } from "@eternal-twin/twinoid-archive-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/lib/client.js";
import { MemUserStore } from "@eternal-twin/user-store-mem";
import { PgUserStore } from "@eternal-twin/user-store-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";
import urljoin from "url-join";

export interface Api {
  auth: AuthService;
  dinoparc: DinoparcService;
  forum: ForumService;
  hammerfest: HammerfestService;
  hammerfestArchive: HammerfestArchiveService;
  hammerfestClient: HammerfestClientService;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  userStore: UserStore;
  twinoidClient: TwinoidClientService;
  user: UserService;
}

async function createApi(config: Config): Promise<{api: Api; teardown(): Promise<void>}> {
  const clock = new SystemClockService();
  const uuidGenerator = UUID4_GENERATOR;
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new url.URL(config.etwin.externalUri.toString()));
  const password = new ScryptPasswordService();
  const dinoparcClient = new HttpDinoparcClientService();
  const hammerfestClient = new HttpHammerfestClientService();
  const twinoidClient = new HttpTwinoidClientService();

  let auth: AuthService;
  let forum: ForumService;
  let dinoparcStore: DinoparcStore;
  let hammerfestArchive: HammerfestArchiveService;
  let link: LinkService;
  let oauthProviderStore: OauthProviderStore;
  let oauthProvider: OauthProviderService;
  let twinoidArchive: TwinoidArchiveService;
  let userStore: UserStore;
  let token: TokenService;

  let teardown: () => Promise<void>;

  if (config.etwin.api === ApiType.InMemory) {
    userStore = new MemUserStore({uuidGenerator});
    dinoparcStore = new MemDinoparcStore();
    hammerfestArchive = new InMemoryHammerfestArchiveService();
    twinoidArchive = new InMemoryTwinoidArchiveService();
    link = new InMemoryLinkService({dinoparcStore, hammerfestArchive, twinoidArchive, userStore});
    oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
    oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
    auth = new InMemoryAuthService({dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestArchive, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator});
    forum = new InMemoryForumService(uuidGenerator, userStore, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});
    token = new InMemoryTokenService(clock, dinoparcStore, hammerfestArchive);

    teardown = async function(): Promise<void> {};
  } else {
    const {pool, teardown: teardownPool} = createPgPool({
      host: config.db.host,
      port: config.db.port,
      name: config.db.name,
      user: config.db.user,
      password: config.db.password,
    });
    const database = new Database(pool);
    dinoparcStore = new PgDinoparcStore(database);
    hammerfestArchive = new PgHammerfestArchiveService(database);
    twinoidArchive = new PgTwinoidArchiveService(database);
    userStore = new PgUserStore({database, databaseSecret: secretKeyStr, uuidGenerator});
    link = new PgLinkService({database, dinoparcStore, hammerfestArchive, twinoidArchive, userStore});
    hammerfestArchive = new PgHammerfestArchiveService(database);
    oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
    auth = new PgAuthService({database, databaseSecret: secretKeyStr, dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestArchive, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidArchive, twinoidClient, uuidGenerator});
    forum = new PgForumService(database, uuidGenerator, userStore, {postsPerPage: config.forum.postsPerPage, threadsPerPage: config.forum.threadsPerPage});
    token = new PgTokenService(database, secretKeyStr, dinoparcStore, hammerfestArchive);

    teardown = async function(): Promise<void> {
      await teardownPool();
    };
  }

  const dinoparc = new DinoparcService({dinoparcStore, link});
  const hammerfest = new HammerfestService({hammerfestArchive, hammerfestClient, link});
  const user = new UserService({auth, dinoparcClient, dinoparcStore, hammerfestArchive, hammerfestClient, link, userStore, token, twinoidArchive, twinoidClient});

  const koaAuth = new KoaAuth(auth);
  const oauthClient = new HttpOauthClientService({
    authorizationUri: new url.URL("https://twinoid.com/oauth/auth"),
    callbackUri: new url.URL(urljoin(config.etwin.externalUri.toString(), "oauth/callback")),
    clientId: config.auth.twinoid.clientId,
    clientSecret: config.auth.twinoid.secret,
    clock,
    grantUri: new url.URL("https://twinoid.com/oauth/token"),
    tokenSecret: secretKeyBytes,
  });

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

  const api: Api = {auth, dinoparc, forum, hammerfest, hammerfestArchive, hammerfestClient, koaAuth, oauthClient, oauthProvider, userStore, twinoidClient, user};

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
