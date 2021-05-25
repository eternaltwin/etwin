import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { $CompleteSimpleUser, CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { COMPLETE_USER_FIELDS } from "@eternal-twin/core/lib/user/complete-user-fields.js";
import { DEFAULT_USER_FIELDS } from "@eternal-twin/core/lib/user/default-user-fields.js";
import { MaybeCompleteSimpleUser } from "@eternal-twin/core/lib/user/maybe-complete-simple-user.js";
import { NullableShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SHORT_USER_FIELDS } from "@eternal-twin/core/lib/user/short-user-fields.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { ScryptPasswordService } from "../lib/password.js";
import { MemUserStore, PgUserStore } from "../lib/user-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeUserStore", function () {
  describe("MemUserStore", function () {
    async function withMemUserStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const uuidGenerator = new Uuid4Generator();
      const password = ScryptPasswordService.recommendedForTests();
      const userStore = new MemUserStore({clock, uuidGenerator});
      return fn({clock, password, userStore});
    }

    testUserService(withMemUserStore);
  });

  describe("PgUserStore", function () {
    async function withPgUserStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
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

      const nativeDatabase = await NativeDatabase.create(dbConfig);

      const secretKeyStr = config.etwin.secret;
      const clock = new SystemClock();
      const uuidGenerator = new Uuid4Generator();
      const password = ScryptPasswordService.recommendedForTests();
      const userStore = new PgUserStore({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
      try {
        return await fn({clock, password, userStore});
      } finally {
        await nativeDatabase.close();
      }
    }

    testUserService(withPgUserStore);
  });
});

interface TestApi {
  clock: ClockService;
  password: PasswordService;
  userStore: UserStore;
}

async function createUser(
  api: {password: PasswordService; userStore: UserStore},
  username: Username,
  displayName: UserDisplayName,
  password: string,
): Promise<UserAuthContext> {
  const userAndSession = await api.userStore.createUser({
    displayName,
    username,
    email: null,
    password: await api.password.hash(Buffer.from(password)),
  });
  return {
    type: AuthType.User,
    scope: AuthScope.Default,
    user: userAndSession,
    isAdministrator: userAndSession.isAdministrator,
  };
}

function testUserService(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Register the admin and retrieve itself (short)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api, "alice", "Alice", "aaaaa");
      {
        const actual: NullableShortUser = await api.userStore.getUser({ref: {id: aliceAuth.user.id}, fields: SHORT_USER_FIELDS});
        chai.assert.isNotNull(actual);
        const expected: NullableShortUser = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: {current: {value: "Alice"}},
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Register the admin and retrieve itself (complete)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api, "alice", "Alice", "aaaaa");
      {
        const actual: MaybeCompleteSimpleUser | null = await api.userStore.getUser({ref: {id: aliceAuth.user.id}, fields: COMPLETE_USER_FIELDS});
        chai.assert.isNotNull(actual);
        if (!$CompleteSimpleUser.test(actual)) {
          throw new Error("AssertionError: Expected CompleteSimpleUser");
        }
        const expected: CompleteSimpleUser = {
          type: ObjectType.User,
          id: actual.id,
          createdAt: actual.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: NOW,
              //   user: {
              //     type: ObjectType.User,
              //     id: actual.id,
              //     displayName: {current: {value: "Alice"}},
              //   }
              // },
              // end: null,
              value: "Alice",
            },
            // old: [],
          },
          isAdministrator: true,
          username: "alice",
          emailAddress: null,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Register an admin and user, retrieve its default fields", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api, "alice", "Alice", "aaaaa");
      {
        const actual: SimpleUser | null = await api.userStore.getUser({ref: {id: aliceAuth.user.id}, fields: DEFAULT_USER_FIELDS});
        chai.assert.isNotNull(actual);
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: actual!.id,
          createdAt: actual!.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: NOW,
              //   user: {
              //     type: ObjectType.User,
              //     id: actual!.id,
              //     displayName: {current: {value: "Alice"}},
              //   }
              // },
              // end: null,
              value: "Alice",
            },
            // old: [],
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
