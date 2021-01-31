import { InMemoryAuthService } from "@eternal-twin/auth-in-memory";
import { PgAuthService } from "@eternal-twin/auth-pg";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GUEST_AUTH } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import { MemDinoparcClient } from "@eternal-twin/dinoparc-client-mem";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { JsonEmailTemplateService } from "@eternal-twin/email-template-json";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { InMemoryOauthProviderStore } from "@eternal-twin/oauth-provider-in-memory";
import { PgOauthProviderStore } from "@eternal-twin/oauth-provider-pg";
import { ScryptPasswordService } from "@eternal-twin/password-scrypt";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import { HttpTwinoidClientService } from "@eternal-twin/twinoid-client-http";
import chai from "chai";

import { VirtualClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemDinoparcStore, PgDinoparcStore } from "../lib/dinoparc-store.js";
import { MemHammerfestClient } from "../lib/hammerfest-client.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { MemLinkStore, PgLinkStore } from "../lib/link-store.js";
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
      const email = new InMemoryEmailService();
      const emailTemplate = new JsonEmailTemplateService(new Url("https://eternal-twin.net"));
      const password = new ScryptPasswordService();
      const userStore = new MemUserStore({clock, uuidGenerator});
      const dinoparcStore = new MemDinoparcStore({clock});
      const hammerfestStore = new MemHammerfestStore({clock});
      const twinoidStore = new MemTwinoidStore({clock});
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
    async function withPgLinkStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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
        const emailTemplate = new JsonEmailTemplateService(new Url("https://eternal-twin.net"));
        const password = new ScryptPasswordService();
        const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
        const dinoparcStore = new PgDinoparcStore({clock, database: nativeDatabase});
        const hammerfestStore = new PgHammerfestStore({clock, database: nativeDatabase});
        const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
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
