import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { LinkHammerfestUserOptions } from "@eternal-twin/etwin-api-types/lib/auth/link-hammerfest-user-options.js";
import { LoginWithHammerfestOptions } from "@eternal-twin/etwin-api-types/lib/auth/login-with-hammerfest-options.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { LocaleId } from "@eternal-twin/etwin-api-types/lib/core/locale-id.js";
import { EmailTemplateService } from "@eternal-twin/etwin-api-types/lib/email-template/service.js";
import { EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/etwin-api-types/lib/email/service.js";
import { Database, TransactionMode } from "@eternal-twin/pg-db";
import jsonWebToken from "jsonwebtoken";

export class PgAuthService implements AuthService {
  private readonly database: Database;
  private readonly email: EmailService;
  private readonly emailTemplate: EmailTemplateService;
  private readonly defaultLocale: LocaleId;
  private readonly tokenSecret: Buffer;

  /**
   * Creates a new authentication service.
   *
   * @param database Email service to use.
   * @param email Email service to use.
   * @param emailTemplate Email template service to use.
   * @param tokenSecret Secret key used to generated and verify tokens.
   */
  constructor(database: Database, email: EmailService, emailTemplate: EmailTemplateService, tokenSecret: Uint8Array) {
    this.database = database;
    this.email = email;
    this.emailTemplate = emailTemplate;
    this.tokenSecret = Buffer.from(tokenSecret);
    this.defaultLocale = "en-US";
  }

  /**
   * Sends a registration or login email.
   *
   * @param acx Auth context
   * @param options Options
   */
  async registerOrLoginWithEmail(acx: AuthContext, options: RegisterOrLoginWithEmailOptions): Promise<void> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const token: string = await this.createEmailVerificationToken(options.email);
    const emailLocale: LocaleId = options.locale ?? this.defaultLocale;
    const emailContent = await this.emailTemplate.verifyRegistrationEmail(emailLocale, token);
    await this.email.sendEmail(options.email, emailContent);
  }

  async registerWithVerifiedEmail(acx: AuthContext, _options: RegisterWithVerifiedEmailOptions): Promise<void> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    throw new Error("NotImplemented");
  }

  async registerOrLoginWithHammerfest(acx: AuthContext, _options: LoginWithHammerfestOptions): Promise<void> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    this.database.transaction(TransactionMode.ReadWrite, async () => {
      throw new Error("NotImplemented");
    });
  }

  async linkHammerfestUser(_acx: AuthContext, _options: LinkHammerfestUserOptions): Promise<void> {
    throw new Error("NotImplemented");
  }

  private async createEmailVerificationToken(emailAddress: EmailAddress): Promise<string> {
    return jsonWebToken.sign(
      {email: emailAddress},
      this.tokenSecret,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      },
    );
  }
}
