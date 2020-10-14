import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/core/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/lib/auth/register-with-verified-email-options";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { EmailContent } from "@eternal-twin/core/lib/email/email-content.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { InMemoryEmailService } from "@eternal-twin/email-in-memory";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import chai from "chai";

export interface Api {
  auth: AuthService;
  email: InMemoryEmailService;
  hammerfestClient: InMemoryHammerfestClientService;
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
            displayName: "Alice",
            isAdministrator: true,
          },
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: "Alice",
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
            displayName: "Alice",
            isAdministrator: true,
          },
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: "Alice",
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
      const actual: UserAndSession = await api.auth.loginWithCredentials(GUEST_AUTH, {login: "alice", password: Buffer.from("aaaaa")});
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: actual.user.id,
            displayName: "Alice",
            isAdministrator: true,
          },
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: "Alice",
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
      api.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));

      const credentials: HammerfestCredentials = {
        server: "hammerfest.fr",
        username: "alice",
        password: Buffer.from("aaaaa"),
      };
      const actual: UserAndSession = await api.auth.registerOrLoginWithHammerfest(GUEST_AUTH, credentials);
      {
        const expected: UserAndSession = {
          user: {
            type: ObjectType.User,
            id: actual.user.id,
            displayName: "alice",
            isAdministrator: true,
          },
          session: {
            id: actual.session.id,
            user: {
              type: ObjectType.User,
              id: actual.user.id,
              displayName: "alice",
            },
            ctime: actual.session.ctime,
            atime: actual.session.ctime,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
