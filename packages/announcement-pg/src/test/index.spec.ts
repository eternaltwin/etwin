import { Api, testAnnouncementService } from "@eternal-twin/announcement-test";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { PgForumService } from "@eternal-twin/forum-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { PgAuthStore } from "@eternal-twin/native/lib/auth-store";
import { VirtualClock } from "@eternal-twin/native/lib/clock";
import { Database as NativeDatabase } from "@eternal-twin/native/lib/database";
import { MemDinoparcClient } from "@eternal-twin/native/lib/dinoparc-client";
import { PgDinoparcStore } from "@eternal-twin/native/lib/dinoparc-store";
import { JsonEmailFormatter } from "@eternal-twin/native/lib/email-formatter";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client";
import { PgHammerfestStore } from "@eternal-twin/native/lib/hammerfest-store";
import { PgLinkStore } from "@eternal-twin/native/lib/link-store";
import { MemMailer } from "@eternal-twin/native/lib/mailer";
import { PgOauthProviderStore } from "@eternal-twin/native/lib/oauth-provider-store";
import { ScryptPasswordService } from "@eternal-twin/native/lib/password";
import { NativeAuthService } from "@eternal-twin/native/lib/services/auth";
import { HttpTwinoidClient } from "@eternal-twin/native/lib/twinoid-client";
import { PgTwinoidStore } from "@eternal-twin/native/lib/twinoid-store";
import { PgUserStore } from "@eternal-twin/native/lib/user-store";
import { Uuid4Generator } from "@eternal-twin/native/lib/uuid";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";

import { PgAnnouncementService } from "../lib/index.js";

async function withPgAnnouncementService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();
  const adminDbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.adminUser,
    password: config.db.adminPassword,
  };
  await withPgPool(adminDbConfig, async (pool) => {
    const database = new Database(pool);
    await forceCreateLatest(database);
  });

  const dbConfig: DbConfig = {
    host: config.db.host,
    port: config.db.port,
    name: config.db.name,
    user: config.db.user,
    password: config.db.password,
  };

  return withPgPool(dbConfig, async (pool) => {
    const database = new Database(pool);
    const nativeDatabase = await NativeDatabase.create(dbConfig);

    const clock = new VirtualClock();
    const uuidGenerator = new Uuid4Generator();
    const secretKeyStr: string = config.etwin.secret;
    const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
    const mailer = await MemMailer.create();
    const emailFormatter = await JsonEmailFormatter.create();
    const passwordService = ScryptPasswordService.recommendedForTests();
    const userStore = new PgUserStore({clock, database:  nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    const dinoparcStore = await PgDinoparcStore.create({clock, database: nativeDatabase, uuidGenerator});
    const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
    const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
    const linkStore = new PgLinkStore({clock, database: nativeDatabase});
    const dinoparcClient = new MemDinoparcClient({clock});
    const hammerfestClient = new MemHammerfestClient({clock});
    const twinoidClient = new HttpTwinoidClient({clock});
    const oauthProviderStore = await PgOauthProviderStore.create({clock, database: nativeDatabase, passwordService, uuidGenerator, secret: secretKeyStr});
    const authStore = await PgAuthStore.create({clock, database: nativeDatabase, uuidGenerator, secret: secretKeyStr});

    const auth = await NativeAuthService.create({authStore, clock, dinoparcClient, dinoparcStore, emailFormatter, hammerfestClient, hammerfestStore, linkStore, mailer, oauthProviderStore, passwordService, userStore, twinoidClient, twinoidStore, uuidGenerator, authSecret: secretKeyBytes});

    const forumConfig: ForumConfig = {postsPerPage: 10, threadsPerPage: 20};
    const forum = new PgForumService(database, uuidGenerator, userStore, forumConfig);
    const announcement = new PgAnnouncementService({database, uuidGenerator, forum});
    try {
      return await fn({auth, forum, announcement});
    } finally {
      await nativeDatabase.close();
    }
  });
}

describe("PgAnnouncementervice", function () {
  testAnnouncementService(withPgAnnouncementService);
});
