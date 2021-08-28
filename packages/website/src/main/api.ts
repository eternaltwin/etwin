import { MemAnnouncementService } from "@eternal-twin/announcement-mem";
import { PgAnnouncementService } from "@eternal-twin/announcement-pg";
import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { ClockService } from "@eternal-twin/core/lib/clock/service";
import { $Url, Url } from "@eternal-twin/core/lib/core/url";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import { ForumService } from "@eternal-twin/core/lib/forum/service";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import { DefaultLinkService, LinkService } from "@eternal-twin/core/lib/link/service";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { DefaultOauthProviderService, OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store";
import { TokenService } from "@eternal-twin/core/lib/token/service";
import { TwinoidClient } from "@eternal-twin/core/lib/twinoid/client";
import { DefaultTwinoidService, TwinoidService } from "@eternal-twin/core/lib/twinoid/service";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store";
import { DefaultUserService, UserService } from "@eternal-twin/core/lib/user/service";
import { UserStore } from "@eternal-twin/core/lib/user/store";
import { ConsoleEmailService } from "@eternal-twin/email-console";
import { EtwinEmailTemplateService } from "@eternal-twin/email-template-etwin";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { PgForumService } from "@eternal-twin/forum-pg";
import { ApiType, Config } from "@eternal-twin/local-config";
import { SystemClock } from "@eternal-twin/native/lib/clock";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database";
import { HttpDinoparcClient } from "@eternal-twin/native/lib/dinoparc-client";
import { MemDinoparcStore, NativeDinoparcStore, PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store";
import { HttpHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client";
import { MemHammerfestStore, NativeHammerfestStore, PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store";
import { MemLinkStore, NativeLinkStore, PgLinkStore } from "@eternal-twin/native/lib/link-store";
import { ScryptPasswordService } from "@eternal-twin/native/lib/password";
import { NativeDinoparcService } from "@eternal-twin/native/lib/services/dinoparc";
import { NativeHammerfestService } from "@eternal-twin/native/lib/services/hammerfest";
import { MemTokenStore, PgTokenStore } from "@eternal-twin/native/lib/token-store";
import { HttpTwinoidClient } from "@eternal-twin/native/lib/twinoid-client";
import { MemTwinoidStore, PgTwinoidStore } from "@eternal-twin/native/lib/twinoid-store";
import { MemUserStore, NativeUserStore, PgUserStore } from "@eternal-twin/native/lib/user-store";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid";
import { HttpOauthClientService } from "@eternal-twin/oauth-client-http";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { createPgPool, Database } from "@eternal-twin/pg-db";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import { DevApi } from "@eternal-twin/rest-server/lib/index";
import urljoin from "url-join";

export interface Api {
  announcement: AnnouncementService;
  auth: AuthService;
  dinoparc: NativeDinoparcService;
  clock: ClockService;
  dev: DevApi | null;
  forum: ForumService;
  hammerfest: NativeHammerfestService;
  hammerfestStore: HammerfestStore;
  hammerfestClient: HammerfestClient;
  koaAuth: KoaAuth;
  oauthClient: OauthClientService;
  oauthProvider: OauthProviderService;
  userStore: UserStore;
  twinoidClient: TwinoidClient;
  twinoid: TwinoidService;
  user: UserService;
}

async function createApi(config: Config): Promise<{ api: Api; teardown(): Promise<void> }> {
  const clock = new SystemClock();
  const uuidGenerator = new Uuid4Generator();
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const email = new ConsoleEmailService();
  const emailTemplate = new EtwinEmailTemplateService(new Url(config.etwin.externalUri.toString()));
  const password = ScryptPasswordService.withOsRng();
  const dinoparcClient = new HttpDinoparcClient({clock});
  const hammerfestClient = new HttpHammerfestClient({clock});
  const twinoidClient = new HttpTwinoidClient({clock});
  const forumConfig: ForumConfig = {
    postsPerPage: config.forum.postsPerPage,
    threadsPerPage: config.forum.threadsPerPage
  };

  let announcement: AnnouncementService;
  let auth: AuthService;
  let forum: ForumService;
  let dinoparcStore: NativeDinoparcStore;
  let hammerfestStore: NativeHammerfestStore;
  let linkStore: NativeLinkStore;
  let link: LinkService;
  let oauthProviderStore: OauthProviderStore;
  let oauthProvider: OauthProviderService;
  let twinoidStore: TwinoidStore;
  let userStore: NativeUserStore;
  let token: TokenService;

  let teardown: () => Promise<void>;

  if (config.etwin.api === ApiType.InMemory) {
    userStore = new MemUserStore({clock, uuidGenerator});
    dinoparcStore = new MemDinoparcStore({clock});
    hammerfestStore = new MemHammerfestStore({clock});
    twinoidStore = new MemTwinoidStore({clock});
    linkStore = new MemLinkStore({clock});
    link = new DefaultLinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
    oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
    oauthProvider = new DefaultOauthProviderService({
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
    token = new MemTokenStore({clock});
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
    dinoparcStore = await PgDinoparcStore.create({clock, database: nativeDatabase, uuidGenerator});
    hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
    userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    linkStore = new PgLinkStore({clock, database: nativeDatabase});
    link = new DefaultLinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
    oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    oauthProvider = new DefaultOauthProviderService({
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
    token = await PgTokenStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr});
    announcement = new PgAnnouncementService({database, uuidGenerator, forum});

    teardown = async function (): Promise<void> {
      await teardownPool();
    };
  }

  const dinoparc = await NativeDinoparcService.create({dinoparcStore, linkStore, userStore});
  const hammerfest = await NativeHammerfestService.create({hammerfestClient, hammerfestStore, linkStore, userStore});
  const twinoid = new DefaultTwinoidService({twinoidStore, link});
  const user = new DefaultUserService({
    dinoparcClient,
    dinoparcStore,
    hammerfestStore,
    hammerfestClient,
    link,
    password,
    token,
    twinoidStore,
    twinoidClient,
    userStore,
  });

  const koaAuth = new KoaAuth(auth);
  const oauthClient = new HttpOauthClientService({
    authorizationUri: new Url("https://twinoid.com/oauth/auth"),
    callbackUri: new Url(urljoin(config.etwin.externalUri.toString(), "oauth/callback")),
    clientId: config.auth.twinoid.clientId,
    clientSecret: config.auth.twinoid.secret,
    clock,
    grantUri: new Url("https://twinoid.com/oauth/token"),
    tokenSecret: secretKeyBytes,
  });

  for (const [key, client] of config.clients) {
    await oauthProvider.createOrUpdateSystemClient(
      key,
      {
        displayName: client.displayName,
        appUri: $Url.clone(client.appUri),
        callbackUri: $Url.clone(client.callbackUri),
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
    clock,
    dev: null,
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
