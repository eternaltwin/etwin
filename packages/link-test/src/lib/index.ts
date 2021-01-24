import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserAuthContext } from "@eternal-twin/core/lib/auth/user-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";

export interface Api {
  auth: AuthService;
  link: LinkService;
  twinoidStore: TwinoidStore;
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
    isAdministrator: userAndSession.isAdministrator,
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
    return withApi(async (api: Api): Promise<void> => {
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
