import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { GUEST_AUTH } from "@eternal-twin/core/lib/auth/guest-auth-context";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { DefaultLinkService, LinkService } from "@eternal-twin/core/lib/link/service";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name";
import { Username } from "@eternal-twin/core/lib/user/username";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { HttpTwinoidClient } from "@eternal-twin/native/lib/twinoid-client";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { MemAuthStore, PgAuthStore } from "../lib/auth-store.js";
import { VirtualClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemDinoparcClient } from "../lib/dinoparc-client.js";
import { MemDinoparcStore, PgDinoparcStore } from "../lib/dinoparc-store.js";
import { JsonEmailFormatter } from "../lib/email-formatter.js";
import { MemHammerfestClient } from "../lib/hammerfest-client.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { MemLinkStore, PgLinkStore } from "../lib/link-store.js";
import { MemMailer } from "../lib/mailer.js";
import { MemOauthProviderStore, PgOauthProviderStore } from "../lib/oauth-provider-store.js";
import { ScryptPasswordService } from "../lib/password.js";
import { NativeAuthService } from "../lib/services/auth.js";
import { MemTwinoidStore, PgTwinoidStore } from "../lib/twinoid-store.js";
import { MemUserStore, PgUserStore } from "../lib/user-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeLinkStore", function () {
  describe("MemLinkStore", function () {
    async function withMemLinkStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const config = await getLocalConfig();

      const clock = new VirtualClock();
      const uuidGenerator = new Uuid4Generator();
      const secretKeyStr: string = config.etwin.secret;
      const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
      const mailer = await MemMailer.create();
      const emailFormatter = await JsonEmailFormatter.create();
      const passwordService = ScryptPasswordService.recommendedForTests();
      const userStore = new MemUserStore({clock, uuidGenerator});
      const dinoparcStore = new MemDinoparcStore({clock});
      const hammerfestStore = new MemHammerfestStore({clock});
      const twinoidStore = new MemTwinoidStore({clock});
      const linkStore = new MemLinkStore({clock});
      const link = new DefaultLinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
      const dinoparcClient = new MemDinoparcClient({clock});
      const hammerfestClient = new MemHammerfestClient({clock});
      const twinoidClient = new HttpTwinoidClient({clock});
      const oauthProviderStore = await MemOauthProviderStore.create({clock, passwordService, uuidGenerator});
      const authStore = await MemAuthStore.create({clock, uuidGenerator});

      const auth = await NativeAuthService.create({authStore, clock, dinoparcClient, dinoparcStore, emailFormatter, hammerfestClient, hammerfestStore, linkStore, mailer, oauthProviderStore, passwordService, userStore, twinoidClient, twinoidStore, uuidGenerator, authSecret: secretKeyBytes});

      return fn({auth, twinoidStore, link});
    }

    testLinkService(withMemLinkStore);
  });

  describe("PgLinkStore", function () {
    async function withPgLinkStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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

      return withPgPool(dbConfig, async () => {
        const nativeDatabase = await NativeDatabase.create(dbConfig);

        const clock = new VirtualClock();
        const uuidGenerator = new Uuid4Generator();
        const secretKeyStr: string = config.etwin.secret;
        const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
        const mailer = await MemMailer.create();
        const emailFormatter = await JsonEmailFormatter.create();
        const passwordService = ScryptPasswordService.recommendedForTests();
        const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        const dinoparcStore = await PgDinoparcStore.create({clock, database: nativeDatabase, uuidGenerator});
        const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
        const linkStore = new PgLinkStore({clock, database: nativeDatabase});
        const link = new DefaultLinkService({dinoparcStore, hammerfestStore, linkStore, twinoidStore, userStore});
        const dinoparcClient = new MemDinoparcClient({clock});
        const hammerfestClient = new MemHammerfestClient({clock});
        const twinoidClient = new HttpTwinoidClient({clock});
        const oauthProviderStore = await PgOauthProviderStore.create({clock, database: nativeDatabase, passwordService, uuidGenerator, secret: secretKeyStr});
        const authStore = await PgAuthStore.create({clock, database: nativeDatabase, uuidGenerator, secret: secretKeyStr});

        const auth = await NativeAuthService.create({authStore, clock, dinoparcClient, dinoparcStore, emailFormatter, hammerfestClient, hammerfestStore, linkStore, mailer, oauthProviderStore, passwordService, userStore, twinoidClient, twinoidStore, uuidGenerator, authSecret: secretKeyBytes});
        try {
          return await fn({auth, twinoidStore, link});
        } finally {
          await nativeDatabase.close();
        }
      });
    }

    testLinkService(withPgLinkStore);
  });
});

interface TestApi {
  auth: AuthService;
  link: LinkService;
  twinoidStore: TwinoidStore;
}

async function createUser(
  auth: AuthService,
  username: Username,
  displayName: UserDisplayName,
  password: string,
): Promise<UserAuthContext> {
  const usernameOptions: RegisterWithUsernameOptions = {
    username,
    displayName,
    password: Buffer.from(password),
  };
  const userAndSession: UserAndSession = await auth.registerWithUsername(GUEST_AUTH, usernameOptions);
  return {
    type: AuthType.User,
    scope: AuthScope.Default,
    user: userAndSession.user,
    isAdministrator: userAndSession.isAdministrator,
  };
}

function testLinkService(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Retrieve links for a user with no links", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      {
        const actual: VersionedLinks = await api.link.getVersionedLinks(aliceAuth.user.id);
        const expected: VersionedLinks = {
          dinoparcCom: {
            current: null,
            old: [],
          },
          enDinoparcCom: {
            current: null,
            old: [],
          },
          hammerfestEs: {
            current: null,
            old: [],
          },
          hammerfestFr: {
            current: null,
            old: [],
          },
          hfestNet: {
            current: null,
            old: [],
          },
          spDinoparcCom: {
            current: null,
            old: [],
          },
          twinoid: {
            current: null,
            old: [],
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Link to twinoid and retrieve links", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      const alice: ShortTwinoidUser = {
        type: ObjectType.TwinoidUser,
        id: "1",
        displayName: "alice",
      };
      await api.twinoidStore.touchShortUser(alice);
      await api.link.linkToTwinoid({
        userId: aliceAuth.user.id,
        twinoidUserId: alice.id,
        linkedBy: aliceAuth.user.id,
      });
      {
        const actual: VersionedLinks = await api.link.getVersionedLinks(aliceAuth.user.id);
        const expected: VersionedLinks = {
          dinoparcCom: {
            current: null,
            old: [],
          },
          enDinoparcCom: {
            current: null,
            old: [],
          },
          hammerfestEs: {
            current: null,
            old: [],
          },
          hammerfestFr: {
            current: null,
            old: [],
          },
          hfestNet: {
            current: null,
            old: [],
          },
          spDinoparcCom: {
            current: null,
            old: [],
          },
          twinoid: {
            current: {
              link: {
                time: actual.twinoid.current!.link.time,
                user: {
                  type: ObjectType.User,
                  id: aliceAuth.user.id,
                  displayName: {
                    current: {
                      value: "Alice",
                    },
                  },
                },
              },
              unlink: null,
              user: {
                type: ObjectType.TwinoidUser,
                id: "1",
                displayName: "alice",
              },
            },
            old: [],
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
