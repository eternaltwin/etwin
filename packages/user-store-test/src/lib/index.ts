import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ClockService } from "@eternal-twin/core/lib/clock/service";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
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
import chai from "chai";

export interface Api {
  clock: ClockService;
  userStore: UserStore;
}

async function createUser(
  userStore: UserStore,
  username: Username,
  displayName: UserDisplayName,
  _password: string,
): Promise<UserAuthContext> {
  const userAndSession = await userStore.createUser({
    displayName,
    username,
    email: null,
  });
  return {
    type: AuthType.User,
    scope: AuthScope.Default,
    user: userAndSession,
    isAdministrator: userAndSession.isAdministrator,
  };
}

export function testUserService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Register the admin and retrieve itself (short)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.userStore, "alice", "Alice", "aaaaa");
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
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.userStore, "alice", "Alice", "aaaaa");
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
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.userStore, "alice", "Alice", "aaaaa");
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
