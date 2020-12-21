import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GUEST_AUTH } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
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
  auth: AuthService;
  userStore: UserStore;
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
    isAdministrator: userAndSession.user.isAdministrator,
  };
}

export function testUserService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Register the admin and retrieve itself (ref)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
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
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      {
        const actual: MaybeCompleteSimpleUser | null = await api.userStore.getUser({ref: {id: aliceAuth.user.id}, fields: COMPLETE_USER_FIELDS});
        chai.assert.isNotNull(actual);
        chai.assert.instanceOf((actual as CompleteSimpleUser).ctime, Date);
        const expected: CompleteSimpleUser = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
          ctime: (actual as CompleteSimpleUser).ctime,
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
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      {
        const actual: MaybeCompleteSimpleUser | null = await api.userStore.getUser({ref: {id: aliceAuth.user.id}, fields: DEFAULT_USER_FIELDS});
        chai.assert.isNotNull(actual);
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
