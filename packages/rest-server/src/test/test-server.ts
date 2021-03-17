import { PgAnnouncementService } from "@eternal-twin/announcement-pg";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { PgForumService } from "@eternal-twin/forum-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { SystemClock, VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { MemDinoparcClient } from "@eternal-twin/native/lib/dinoparc-client.js";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { PgLinkStore } from "@eternal-twin/native/lib/link-store.js";
import { ScryptPasswordService } from "@eternal-twin/native/lib/password.js";
import { PgTwinoidStore } from "@eternal-twin/native/lib/twinoid-store.js";
import { PgUserStore } from "@eternal-twin/native/lib/user-store.js";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid.js";
import { NativeClock } from "@eternal-twin/native/src/lib/clock.js";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { PgTokenService } from "@eternal-twin/token-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import http from "http";
import Koa from "koa";

import { KoaAuth } from "../lib/helpers/koa-auth.js";
import { Api, createApiRouter, DevApi } from "../lib/index.js";

export interface TestServer {
  hammerfestClient: MemHammerfestClient,
  server: http.Server,
}

export async function withTestServer<R>(isDev: boolean, fn: (server: TestServer) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password
  };

  return withPgPool(dbConfig, async (pool) => {
    const database = new Database(pool);
    const nativeDatabase = await NativeDatabase.create(dbConfig);
    await forceCreateLatest(database);

    let dev: DevApi | null;
    let clock: NativeClock;
    if (isDev) {
      const devClock = new VirtualClock();
      clock = devClock;
      dev = {clock: devClock};
    } else {
      dev = null;
      clock = new SystemClock();
    }
    const uuidGenerator = new Uuid4Generator();
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new Url("https://eternal-twin.net"));
    const password = ScryptPasswordService.recommendedForTests();
    const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    const dinoparcClient = new MemDinoparcClient({clock});
    const dinoparcStore = await PgDinoparcStore.create({clock, database: nativeDatabase});
    const hammerfestClient = new MemHammerfestClient({clock});
    const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    const twinoidClient = new HttpTwinoidClientService();
    const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
    const linkStore = new PgLinkStore({clock, database: nativeDatabase});
    const link = new LinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
    const dinoparc = new DinoparcService({dinoparcStore, link});
    const hammerfest = new HammerfestService({hammerfestStore, hammerfestClient, link});
    const twinoid = new TwinoidService({twinoidStore, link});
    const oauthProviderStore = new PgOauthProviderStore({
      database,
      databaseSecret: secretKeyStr,
      password,
      uuidGenerator
    });
    const oauthProvider = new OauthProviderService({
      clock,
      oauthProviderStore,
      userStore,
      tokenSecret: secretKeyBytes,
      uuidGenerator
    });
    const auth = new PgAuthService({
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
    const koaAuth = new KoaAuth(auth);
    const token = new PgTokenService(database, secretKeyStr, dinoparcStore, hammerfestStore);
    const forumConfig: ForumConfig = {
      postsPerPage: config.forum.postsPerPage,
      threadsPerPage: config.forum.threadsPerPage
    };
    const forum = new PgForumService(database, uuidGenerator, userStore, forumConfig);
    const announcement = new PgAnnouncementService({database, uuidGenerator, forum});
    const user = new UserService({
      dinoparcClient,
      dinoparcStore,
      hammerfestStore,
      hammerfestClient,
      link,
      password,
      userStore,
      token,
      twinoidStore,
      twinoidClient
    });
    const api: Api = {announcement, auth, dinoparc, clock, dev, forum, hammerfest, koaAuth, twinoid, user};

    const app: Koa = new Koa();
    const router = createApiRouter(api);
    app.use(router.routes());
    app.use(router.allowedMethods());

    const server: http.Server = http.createServer(app.callback());

    async function closeServer(): Promise<void> {
      return new Promise<void>(resolve => {
        server.close(() => {
          resolve();
        });
      });
    }

    const result = new Promise<R>((resolve, reject): void => {
      async function onListening(): Promise<void> {
        server.removeListener("error", onError);

        let result: R;
        try {
          result = await fn({hammerfestClient, server});
        } catch (err) {
          await closeServer();
          reject(err);
          return;
        }
        await closeServer();
        resolve(result);
      }

      function onError(err: Error): void {
        server.removeListener("listening", onListening);
        reject(err);
      }

      server.once("listening", onListening);
      server.once("error", onError);

      server.listen();
    });

    try {
      return await result;
    } finally {
      await nativeDatabase.close();
    }
  });
}
