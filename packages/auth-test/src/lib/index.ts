import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/core/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { VersionedLinks } from "@eternal-twin/core/lib/link/versioned-links.js";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { MemHammerfestClient } from "@eternal-twin/native/lib/hammerfest-client.js";
import chai from "chai";

export interface Api {
  auth: AuthService;
  email: InMemoryEmailService;
  hammerfestClient: MemHammerfestClient;
  link: LinkService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export function testAuthService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Registers a user through email", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      api.email.createInbox("alice@example.com");
      const emailOtions: RegisterOrLoginWithEmailOptions = {
        email: "alice@example.com",
        locale: "fr-FR",
      };
      await api.auth.registerOrLoginWithEmail(GUEST_AUTH, emailOtions);
      let token: string;
      {
        const actualEmails: readonly EmailContent[] = api.email.readInbox("alice@example.com");
        chai.assert.lengthOf(actualEmails, 1);
        const actualEmail: EmailContent = actualEmails[0];
        chai.assert.strictEqual(actualEmail.title, "verifyRegistrationEmail");
        const emailData = JSON.parse(actualEmail.textBody);
        chai.assert.isString(emailData.token);
        token = emailData.token;
      }
      chai.assert.isString(token);
      const registerOptions: RegisterWithVerifiedEmailOptions = {
        emailToken: token,
        displayName: "Alice",
        password: Buffer.from("aaaaa"),
      };
      const actual: UserAndSession = await api.auth.registerWithVerifiedEmail(GUEST_AUTH, registerOptions);
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: actual.user.id,
            displayName: {current: {value: "Alice"}},
          },
          isAdministrator: true,
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: {current: {value: "Alice"}},
            },
            ctime: actual.session.ctime,
            atime: actual.session.ctime,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Registers a user with a username", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const usernameOptions: RegisterWithUsernameOptions = {
        username: "alice",
        displayName: "Alice",
        password: Buffer.from("aaaaa"),
      };
      const actual: UserAndSession = await api.auth.registerWithUsername(GUEST_AUTH, usernameOptions);
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: actual.user.id,
            displayName: {current: {value: "Alice"}},
          },
          isAdministrator: true,
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: {current: {value: "Alice"}},
            },
            ctime: actual.session.ctime,
            atime: actual.session.ctime,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Registers a user with a username and signs in", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const usernameOptions: RegisterWithUsernameOptions = {
        username: "alice",
        displayName: "Alice",
        password: Buffer.from("aaaaa"),
      };
      await api.auth.registerWithUsername(GUEST_AUTH, usernameOptions);
      const actual: UserAndSession = await api.auth.loginWithCredentials(GUEST_AUTH, {
        login: "alice",
        password: Buffer.from("aaaaa")
      });
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: actual.user.id,
            displayName: {current: {value: "Alice"}},
          },
          isAdministrator: true,
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: {current: {value: "Alice"}},
            },
            ctime: actual.session.ctime,
            atime: actual.session.ctime,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Registers a user with Hammerfest", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.hammerfestClient.createUser("hammerfest.fr", "123", "alice", "aaaaa");

      const credentials: HammerfestCredentials = {
        server: "hammerfest.fr",
        username: "alice",
        password: "aaaaa",
      };
      const userAndSession: UserAndSession = await api.auth.registerOrLoginWithHammerfest(GUEST_AUTH, credentials);
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: userAndSession.user.id,
            displayName: {current: {value: "alice"}},
          },
          isAdministrator: true,
          session: {
            id: userAndSession.session.id,
            user: {
              type: ObjectType.User,
              id: userAndSession.user.id,
              displayName: {current: {value: "alice"}},
            },
            ctime: userAndSession.session.ctime,
            atime: userAndSession.session.ctime,
          },
        };
        chai.assert.deepEqual(userAndSession, expected);
      }
      {
        // Hammerfest is linked to Eternal-Twin
        const actual: VersionedEtwinLink = await api.link.getLinkFromHammerfest("hammerfest.fr", "123");
        const expected: VersionedEtwinLink = {
          current: {
            link: {
              time: actual.current!.link.time,
              user: {
                type: ObjectType.User,
                id: userAndSession.user.id,
                displayName: {current: {value: "alice"}},
              },
            },
            unlink: null,
            user: {
              type: ObjectType.User,
              id: userAndSession.user.id,
              displayName: {current: {value: "alice"}},
            }
          },
          old: [],
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        // Eternal-Twin is linked to Hammerfest
        const actual: VersionedLinks = await api.link.getVersionedLinks(userAndSession.user.id);
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
            current: {
              link: {
                time: actual.hammerfestFr.current!.link.time,
                user: {
                  type: ObjectType.User,
                  id: userAndSession.user.id,
                  displayName: {current: {value: "alice"}},
                },
              },
              unlink: null,
              user: {
                type: ObjectType.HammerfestUser,
                server: "hammerfest.fr",
                id: "123",
                username: "alice",
              }
            },
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
}
