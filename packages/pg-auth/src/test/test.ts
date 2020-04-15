import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { EmailContent } from "@eternal-twin/etwin-api-types/lib/email/email-content.js";
import { UserRef } from "@eternal-twin/etwin-api-types/lib/user/user-ref";
import { InMemoryEmailService } from "@eternal-twin/in-memory-email";
import chai from "chai";

export interface Api {
  auth: AuthService;
  email: InMemoryEmailService;
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
        emailVerificationToken: token,
        displayName: "Alice",
        password: Buffer.from("aaaaa"),
      };
      const user: UserRef = await api.auth.registerWithVerifiedEmail(GUEST_AUTH, registerOptions);
      {
        const expected: UserRef = {
          id: user.id,
          displayName: "Alice",
        };
        chai.assert.deepEqual(user, expected);
      }
    });
  });
}
