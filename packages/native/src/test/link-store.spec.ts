import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { MemDinoparcClient } from "@eternal-twin/dinoparc-client-mem";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { Api as LinkStoreApi, testLinkService } from "@eternal-twin/link-test";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { MemTwinoidStore } from "@eternal-twin/twinoid-store-mem";
import { PgTwinoidStore } from "@eternal-twin/twinoid-store-pg";
import url from "url";

import { VirtualClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemDinoparcStore, PgDinoparcStore } from "../lib/dinoparc-store.js";
import { MemHammerfestClient } from "../lib/hammerfest-client.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { MemLinkStore, PgLinkStore } from "../lib/link-store.js";
import { MemUserStore, PgUserStore } from "../lib/user-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeLinkStore", function () {
  describe("MemLinkStore", function () {
    async function withMemLinkStore<R>(fn: (api: LinkStoreApi) => Promise<R>): Promise<R> {
      const config = await getLocalConfig();

      const clock = new VirtualClock();
      const uuidGenerator = new Uuid4Generator();
      const secretKeyStr: string = config.etwin.secret;
      const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
      const email = new InMemoryEmailService();
      const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
      const password = new ScryptPasswordService();
      const userStore = new MemUserStore({clock, uuidGenerator});
      const dinoparcStore = new MemDinoparcStore({clock});
      const hammerfestStore = new MemHammerfestStore({clock});
      const twinoidStore = new MemTwinoidStore();
      const linkStore = new MemLinkStore({clock});
      const link = new LinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
      const dinoparcClient = new MemDinoparcClient();
      const hammerfestClient = new MemHammerfestClient({clock});
      const twinoidClient = new HttpTwinoidClientService();
      const oauthProviderStore = new InMemoryOauthProviderStore({clock, password, uuidGenerator});
      const oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
      const auth = new InMemoryAuthService({dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestStore, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidStore, twinoidClient, uuidGenerator});
      return fn({auth, twinoidStore, link});
    }

    testLinkService(withMemLinkStore);
  });

  describe("PgLinkStore", function () {
    async function withPgLinkStore<R>(fn: (api: LinkStoreApi) => Promise<R>): Promise<R> {
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
        await forceCreateLatest(database);
        const nativeDatabase = await NativeDatabase.create(dbConfig);
        const clock = new VirtualClock();
        const uuidGenerator = new Uuid4Generator();
        const secretKeyStr: string = config.etwin.secret;
        const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
        const email = new InMemoryEmailService();
        const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
        const password = new ScryptPasswordService();
        const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
        const hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
        const twinoidStore = new PgTwinoidStore(database);
        const linkStore = new PgLinkStore({clock, database: nativeDatabase});
        const link = new LinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
        const dinoparcClient = new MemDinoparcClient();
        const hammerfestClient = new MemHammerfestClient({clock});
        const twinoidClient = new HttpTwinoidClientService();
        const oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
        const oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
        const auth = new PgAuthService({database, databaseSecret: secretKeyStr, dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestStore, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidStore, twinoidClient, uuidGenerator});
        return fn({auth, twinoidStore, link});
      });
    }

    testLinkService(withPgLinkStore);
  });
});
