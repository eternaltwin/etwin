import { Api, testAuthService } from "@eternal-twin/auth-test";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { MemDinoparcClient } from "@eternal-twin/dinoparc-client-mem";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { PgLinkService } from "@eternal-twin/link-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { VirtualClock } from "@eternal-twin/native/lib/clock.js";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database.js";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store.js";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store.js";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import { PgTwinoidStore } from "@eternal-twin/twinoid-store-pg";
import { PgUserStore } from "@eternal-twin/user-store-pg";
import { UUID4_GENERATOR } from "@eternal-twin/uuid4-generator";
import url from "url";

import { PgAuthService } from "../lib/index.js";

async function withPgAuthService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
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

    const clock = new VirtualClock();
    const uuidGenerator = UUID4_GENERATOR;
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    const email = new InMemoryEmailService();
    const emailTemplate = new JsonEmailTemplateService(new url.URL("https://eternal-twin.net"));
    const password = new ScryptPasswordService();
    const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
    const hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
    const twinoidStore = new PgTwinoidStore(database);
    const userStore = new PgUserStore({clock, database, databaseSecret: secretKeyStr, uuidGenerator});
    const link = new PgLinkService({database, dinoparcStore, hammerfestStore, twinoidStore, userStore});
    const dinoparcClient = new MemDinoparcClient();
    const hammerfestClient = new MemHammerfestClient({clock});
    const twinoidClient = new HttpTwinoidClientService();
    const oauthProviderStore = new PgOauthProviderStore({database, databaseSecret: secretKeyStr, password, uuidGenerator});
    const oauthProvider = new OauthProviderService({clock, oauthProviderStore, userStore, tokenSecret: secretKeyBytes, uuidGenerator});
    const auth = new PgAuthService({database, databaseSecret: secretKeyStr, dinoparcClient, dinoparcStore, email, emailTemplate, hammerfestStore, hammerfestClient, link, oauthProvider, password, userStore, tokenSecret: secretKeyBytes, twinoidStore, twinoidClient, uuidGenerator});
    return fn({auth, email, hammerfestClient, link});
  });
}

describe("PgAuthService", function () {
  testAuthService(withPgAuthService);
});
