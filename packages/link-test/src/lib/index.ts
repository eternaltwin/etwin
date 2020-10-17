import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context";
import { LinkService } from "@eternal-twin/core/lib/link/service";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name";
import { Username } from "@eternal-twin/core/lib/user/username";
import chai from "chai";

export interface Api {
  auth: AuthService;
  link: LinkService;
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

export function testLinkService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve links for a user with no links", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const aliceAuth: UserAuthContext = await createUser(api.auth, "alice", "Alice", "aaaaa");
      {
        const actual: VersionedLinks = await api.link.getVersionedLinks(aliceAuth.user.id);
        const expected: VersionedLinks = {
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
          twinoid: {
            current: null,
            old: [],
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
