import { MemAnnouncementService } from "@eternal-twin/announcement-mem";
import { PgAnnouncementService } from "@eternal-twin/announcement-pg";
import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { HttpDinoparcClient } from "@eternal-twin/dinoparc-client-http";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { PgForumService } from "@eternal-twin/forum-pg";
import { InMemoryLinkService } from "@eternal-twin/link-in-memory";
import { PgLinkService } from "@eternal-twin/link-pg";
import { ApiType, Config } from "@eternal-twin/local-config";
import { SystemClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { MemDinoparcStore, PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { HttpHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import { MemHammerfestStore, PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { HttpOauthClientService } from "@eternal-twin/oauth-client-http";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import { InMemoryTokenService } from "@eternal-twin/token-in-memory";
import { PgTokenService } from "@eternal-twin/token-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/lib/client.js";
import { MemTwinoidStore } from "@eternal-twin/twinoid-store-mem";
import { PgTwinoidStore } from "@eternal-twin/twinoid-store-pg";
import { MemUserStore } from "@eternal-twin/user-store-mem";
import { PgUserStore } from "@eternal-twin/user-store-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";
import urljoin from "url-join";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  dinoparc: DinoparcService;
  forum: ForumService;
  hammerfest: HammerfestService;
  hammerfestStore: HammerfestStore;
  hammerfestClient: HammerfestClient;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  userStore: UserStore;
  twinoidClient: TwinoidClientService;
  twinoid: TwinoidService;
  user: UserService;
}

async function createApi(config: Config): Promise<{ api: Api; teardown(): Promise<void> }> {
  const clock = new SystemClock();
  const uuidGenerator = UUID4_GENERATOR;
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new url.URL(config.etwin.externalUri.toString()));
  const password = new ScryptPasswordService();
  const dinoparcClient = new HttpDinoparcClient();
  const hammerfestClient = new HttpHammerfestClient({clock});
  const twinoidClient = new HttpTwinoidClientService();
  const forumConfig: ForumConfig = {
    postsPerPage: config.forum.postsPerPage,
    threadsPerPage: config.forum.threadsPerPage
  };

  let announcement: AnnouncementService;
  let auth: AuthService;
  let forum: ForumService;
  let dinoparcStore: DinoparcStore;
  let hammerfestStore: HammerfestStore;
  let link: LinkService;
  let oauthProviderStore: OauthProviderStore;
  let oauthProvider: OauthProviderService;
  let twinoidStore: TwinoidStore;
  let userStore: UserStore;
  let token: TokenService;

  let teardown: () => Promise<void>;

  if (config.etwin.api === ApiType.InMemory) {
    userStore = new MemUserStore({clock, uuidGenerator});
    dinoparcStore = new MemDinoparcStore({clock});
    hammerfestStore = new MemHammerfestStore({clock});
    twinoidStore = new MemTwinoidStore();
    link = new InMemoryLinkService({dinoparcStore, hammerfestStore, twinoidStore, userStore});
    oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
    oauthProvider = new OauthProviderService({
      clock,
      oauthProviderStore,
      userStore,
      tokenSecret: secretKeyBytes,
      uuidGenerator
    });
    auth = new InMemoryAuthService({
      dinoparcClient,
      dinoparcStore,
      email,
      emailTemplate,
      hammerfestStore,
      hammerfestClient,
      link,
      oauthProvider,
      password,
      userStore,
      tokenSecret: secretKeyBytes,
      twinoidStore,
      twinoidClient,
      uuidGenerator
    });
    forum = new InMemoryForumService(uuidGenerator, userStore, forumConfig);
    token = new InMemoryTokenService(clock, dinoparcStore, hammerfestStore);
    announcement = new MemAnnouncementService({uuidGenerator, forum});

    teardown = async function (): Promise<void> {
    };
  } else {
    const {pool, teardown: teardownPool} = createPgPool({
      host: config.db.host,
      port: config.db.port,
      name: config.db.name,
      user: config.db.user,
      password: config.db.password,
    });
    const database = new Database(pool);
    const nativeDatabase = await NativeDatabase.create({
      host: config.db.host,
      port: config.db.port,
      name: config.db.name,
      user: config.db.user,
      password: config.db.password,
    });
    dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
    hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
    twinoidStore = new PgTwinoidStore(database);
    userStore = new PgUserStore({clock, database, databaseSecret: secretKeyStr, uuidGenerator});
    link = new PgLinkService({database, dinoparcStore, hammerfestStore, twinoidStore, userStore});
    oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    oauthProvider = new OauthProviderService({
      clock,
      oauthProviderStore,
      userStore,
      tokenSecret: secretKeyBytes,
      uuidGenerator
    });
    auth = new PgAuthService({
      database,
      databaseSecret: secretKeyStr,
      dinoparcClient,
      dinoparcStore,
      email,
      emailTemplate,
      hammerfestStore,
      hammerfestClient,
      link,
      oauthProvider,
      password,
      userStore,
      tokenSecret: secretKeyBytes,
      twinoidStore,
      twinoidClient,
      uuidGenerator
    });
    forum = new PgForumService(database, uuidGenerator, userStore, forumConfig);
    token = new PgTokenService(database, secretKeyStr, dinoparcStore, hammerfestStore);
    announcement = new PgAnnouncementService({database, uuidGenerator, forum});

    teardown = async function (): Promise<void> {
      await teardownPool();
    };
  }

  const dinoparc = new DinoparcService({dinoparcStore, link});
  const hammerfest = new HammerfestService({hammerfestStore, hammerfestClient, link});
  const twinoid = new TwinoidService({twinoidStore, link});
  const user = new UserService({
    auth,
    dinoparcClient,
    dinoparcStore,
    hammerfestStore,
    hammerfestClient,
    link,
    userStore,
    token,
    twinoidStore,
    twinoidClient
  });

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

  const api: Api = {
    announcement,
    auth,
    dinoparc,
    forum,
    hammerfest,
    hammerfestStore,
    hammerfestClient,
    koaAuth,
    oauthClient,
    oauthProvider,
    userStore,
    twinoid,
    twinoidClient,
    user
  };

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
