import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { LinkHammerfestUserOptions } from "@eternal-twin/etwin-api-types/lib/auth/link-hammerfest-user-options.js";
import { LoginWithHammerfestOptions } from "@eternal-twin/etwin-api-types/lib/auth/login-with-hammerfest-options.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { LocaleId } from "@eternal-twin/etwin-api-types/lib/core/locale-id.js";
import { UuidGenerator } from "@eternal-twin/etwin-api-types/lib/core/uuid-generator";
import { EmailTemplateService } from "@eternal-twin/etwin-api-types/lib/email-template/service.js";
import { EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/etwin-api-types/lib/email/service.js";
import { UserDisplayName } from "@eternal-twin/etwin-api-types/lib/user/user-display-name";
import { UserRef } from "@eternal-twin/etwin-api-types/lib/user/user-ref.js";
import { UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";
import jsonWebToken from "jsonwebtoken";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { UuidHex } from "kryo/lib/uuid-hex";

import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";

export const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

export class PgAuthService implements AuthService {
  private readonly database: Database;
  private readonly dbSecret: string;
  private readonly uuidGen: UuidGenerator;
  private readonly email: EmailService;
  private readonly emailTemplate: EmailTemplateService;
  private readonly defaultLocale: LocaleId;
  private readonly tokenSecret: Buffer;

  /**
   * Creates a new authentication service.
   *
   * @param database Email service to use.
   * @param dbSecret Key used to access encrypted columns in the database.
   * @param uuidGen UUID generator to use.
   * @param email Email service to use.
   * @param emailTemplate Email template service to use.
   * @param tokenSecret Secret key used to generated and verify tokens.
   */
  constructor(database: Database, dbSecret: string, uuidGen: UuidGenerator, email: EmailService, emailTemplate: EmailTemplateService, tokenSecret: Uint8Array) {
    this.database = database;
    this.dbSecret = dbSecret;
    this.uuidGen = uuidGen;
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

  async registerWithVerifiedEmail(acx: AuthContext, options: RegisterWithVerifiedEmailOptions): Promise<UserRef> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.registerWithVerifiedEmailTx(acx, options, q);
    });
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

  private async registerWithVerifiedEmailTx(acx: AuthContext, options: RegisterWithVerifiedEmailOptions, queryable: Queryable): Promise<UserRef> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }

    const emailJwt: EmailRegistrationJwt = await this.readEmailVerificationToken(options.emailVerificationToken);

    const email: EmailAddress = emailJwt.email;

    type Row = Pick<UserRow, "user_id" | "display_name">;
    const oldUserRow: Row | undefined = await queryable.oneOrNone(
      `SELECT user_id, display_name
      FROM users
      WHERE users.email_address = pgp_sym_encrypt($2::TEXT, $1::TEXT);`,
      [this.dbSecret, email],
    );
    if (oldUserRow !== undefined) {
      throw new Error(`Conflict: EmailAddressAlreadyInUse: ${JSON.stringify(oldUserRow)}`);
    }

    const id: UuidHex = this.uuidGen.next();
    const displayName: UserDisplayName = options.displayName;

    const userRow: Row = await queryable.one(
      `INSERT INTO users(user_id, ctime, display_name, email_address, email_address_mtime, username, username_mtime)
      VALUES ($2::UUID, NOW(), $3::VARCHAR, pgp_sym_encrypt($4::TEXT, $1::TEXT), NOW(), NULL, NOW())
      RETURNING user_id, display_name;`,
      [this.dbSecret, id, displayName, email],
    );

    return {id: userRow.user_id, displayName: userRow.display_name};
  }

  private async createEmailVerificationToken(emailAddress: EmailAddress): Promise<string> {
    const payload: Omit<EmailRegistrationJwt, "issuedAt" | "expirationTime"> = {
      email: emailAddress,
    };

    return jsonWebToken.sign(
      payload,
      this.tokenSecret,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      },
    );
  }

  private async readEmailVerificationToken(token: string): Promise<EmailRegistrationJwt> {
    const tokenObj: object | string = jsonWebToken.verify(
      token,
      this.tokenSecret
    );
    if (typeof tokenObj !== "object" || tokenObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $EmailRegistrationJwt.read(JSON_VALUE_READER, tokenObj);
  }
}
