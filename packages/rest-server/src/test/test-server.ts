import { PgAnnouncementService } from "@eternal-twin/announcement-pg";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { MemDinoparcClient } from "@eternal-twin/dinoparc-client-mem";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { PgForumService } from "@eternal-twin/forum-pg";
import { PgLinkService } from "@eternal-twin/link-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { SystemClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { PgTokenService } from "@eternal-twin/token-pg";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { PgTwinoidStore } from "@eternal-twin/twinoid-store-pg";
import { PgUserStore } from "@eternal-twin/user-store-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import http from "http";
import Koa from "koa";
import url from "url";

import { KoaAuth } from "../lib/helpers/koa-auth.js";
import { Api, createApiRouter } from "../lib/index.js";

export interface TestServer {
  hammerfestClient: MemHammerfestClient,
  server: http.Server,
}

export async function withTestServer<R>(fn: (server: TestServer) => Promise<R>): Promise<R> {
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

    const clock = new SystemClock();
    const uuidGenerator = UUID4_GENERATOR;
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
    const password = new ScryptPasswordService();
    const userStore = new PgUserStore({clock, database, databaseSecret: secretKeyStr, uuidGenerator});
    const dinoparcClient = new MemDinoparcClient();
    const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
    const hammerfestClient = new MemHammerfestClient({clock});
    const hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
    const twinoidClient = new HttpTwinoidClientService();
    const twinoidStore = new PgTwinoidStore(database);
    const link = new PgLinkService({database, dinoparcStore, hammerfestStore, twinoidStore, userStore});
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
    const api: Api = {announcement, auth, dinoparc, forum, hammerfest, koaAuth, twinoid, user};

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

    return new Promise<R>((resolve, reject): void => {
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
  });
}
