import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import { NullableShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { User } from "@eternal-twin/core/lib/user/user.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";

export interface Api {
  auth: AuthService;
  user: UserService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

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
        const actual: NullableShortUser = await api.user.getShortUserById(aliceAuth, aliceAuth.user.id);
        chai.assert.isNotNull(actual);
        const expected: NullableShortUser = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: "Alice",
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
        const actual: User | CompleteUser | null = await api.user.getUserById(aliceAuth, aliceAuth.user.id);
        chai.assert.isNotNull(actual);
        chai.assert.instanceOf((actual as CompleteUser).ctime, Date);
        const expected: CompleteUser = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: "Alice",
          isAdministrator: true,
          ctime: (actual as CompleteUser).ctime,
          username: "alice",
          emailAddress: null,
          hasPassword: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Register an admin and user, retrieve the admin from the user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      const bobAuth: UserAuthContext = await createUser(api.auth, "bob", "Bob", "bbbbb");
      {
        const actual: User | CompleteUser | null = await api.user.getUserById(bobAuth, aliceAuth.user.id);
        chai.assert.isNotNull(actual);
        const expected: User = {
          type: ObjectType.User,
          id: actual!.id,
          displayName: "Alice",
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
