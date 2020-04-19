import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { Credentials } from "@eternal-twin/etwin-api-types/lib/auth/credentials";
import { LinkHammerfestUserOptions } from "@eternal-twin/etwin-api-types/lib/auth/link-hammerfest-user-options.js";
import { LoginWithHammerfestOptions } from "@eternal-twin/etwin-api-types/lib/auth/login-with-hammerfest-options.js";
import { $Login, Login } from "@eternal-twin/etwin-api-types/lib/auth/login.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { SessionId } from "@eternal-twin/etwin-api-types/lib/auth/session-id.js";
import { Session } from "@eternal-twin/etwin-api-types/lib/auth/session.js";
import { UserAndSession } from "@eternal-twin/etwin-api-types/lib/auth/user-and-session.js";
import { LocaleId } from "@eternal-twin/etwin-api-types/lib/core/locale-id.js";
import { UuidGenerator } from "@eternal-twin/etwin-api-types/lib/core/uuid-generator";
import { EmailTemplateService } from "@eternal-twin/etwin-api-types/lib/email-template/service.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/etwin-api-types/lib/email/service.js";
import { PasswordHash } from "@eternal-twin/etwin-api-types/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/etwin-api-types/lib/password/service.js";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { UserDisplayName } from "@eternal-twin/etwin-api-types/lib/user/user-display-name";
import { UserId } from "@eternal-twin/etwin-api-types/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/etwin-api-types/lib/user/username.js";
import { SessionRow, UserRow } from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";
import jsonWebToken from "jsonwebtoken";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { UuidHex } from "kryo/lib/uuid-hex";

import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

export class PgAuthService implements AuthService {
  private readonly database: Database;
  private readonly dbSecret: string;
  private readonly uuidGen: UuidGenerator;
  private readonly password: PasswordService;
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
   * @param password Password service to use.
   * @param email Email service to use.
   * @param emailTemplate Email template service to use.
   * @param tokenSecret Secret key used to generated and verify tokens.
   */
  constructor(
    database: Database,
    dbSecret: string,
    uuidGen: UuidGenerator,
    password: PasswordService,
    email: EmailService,
    emailTemplate: EmailTemplateService,
    tokenSecret: Uint8Array,
  ) {
    this.database = database;
    this.dbSecret = dbSecret;
    this.uuidGen = uuidGen;
    this.password = password;
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

  async registerWithVerifiedEmail(
    acx: AuthContext,
    options: RegisterWithVerifiedEmailOptions,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.registerWithVerifiedEmailTx(q, acx, options);
    });
  }

  async registerWithUsername(acx: AuthContext, options: RegisterWithUsernameOptions): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.registerWithUsernameTx(q, acx, options);
    });
  }

  async loginWithCredentials(acx: AuthContext, credentials: Credentials): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can log in");
    }
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.loginWithCredentialsTx(q, acx, credentials);
    });
  }

  async registerOrLoginWithHammerfest(acx: AuthContext, _options: LoginWithHammerfestOptions): Promise<void> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    await this.database.transaction(TransactionMode.ReadWrite, async () => {
      throw new Error("NotImplemented");
    });
  }

  async linkHammerfestUser(_acx: AuthContext, _options: LinkHammerfestUserOptions): Promise<void> {
    throw new Error("NotImplemented");
  }

  authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    return this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      const session: Session | null = await this.getAndTouchSession(q, sessionId);
      if (session === null) {
        return null;
      }

      const user: User = await this.getExistingUserById(q, session.user.id);

      return {user, session};
    });
  }

  private async registerWithVerifiedEmailTx(
    queryable: Queryable,
    acx: AuthContext,
    options: RegisterWithVerifiedEmailOptions,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }

    const emailJwt: EmailRegistrationJwt = await this.readEmailVerificationToken(options.emailToken);

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

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const user: User = await this.createUser(queryable, displayName, email, null, passwordHash);

    try {
      await this.createValidatedEmailVerification(queryable, user.id, email, new Date(emailJwt.issuedAt * 1000));
    } catch (err) {
      console.warn(`FailedToCreateEmailVerification\n${err.stack}`);
    }

    const session: Session = await this.createSession(queryable, user.id);

    return {user, session};
  }

  private async registerWithUsernameTx(
    queryable: Queryable,
    acx: AuthContext,
    options: RegisterWithUsernameOptions,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }

    const username: Username = options.username;

    type Row = Pick<UserRow, "user_id" | "display_name">;
    const oldUserRow: Row | undefined = await queryable.oneOrNone(
      `SELECT user_id, display_name
         FROM users
         WHERE users.username = $1::VARCHAR;`,
      [username],
    );
    if (oldUserRow !== undefined) {
      throw new Error(`Conflict: UsernameAlreadyInUse: ${JSON.stringify(oldUserRow)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const user: User = await this.createUser(queryable, displayName, null, username, passwordHash);

    const session: Session = await this.createSession(queryable, user.id);

    return {user, session};
  }

  private async loginWithCredentialsTx(
    queryable: Queryable,
    acx: AuthContext,
    credentials: Credentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const login: Login = credentials.login;
    type Row = Pick<UserRow, "user_id" | "display_name" | "password">;
    let row: Row;
    switch ($Login.match(credentials.login)) {
      case $EmailAddress: {
        const maybeRow: Row | undefined = await queryable.oneOrNone(
          `SELECT user_id, display_name, pgp_sym_decrypt_bytea(password, $1::TEXT) AS password
             FROM users
             WHERE users.email_address = pgp_sym_decrypt_bytea($2::TEXT, $1::TEXT);`,
          [this.dbSecret, login],
        );
        if (maybeRow === undefined) {
          throw new Error(`UserNotFound: User not found for the email: ${login}`);
        }
        row = maybeRow;
        break;
      }
      case $Username: {
        const maybeRow: Row | undefined = await queryable.oneOrNone(
          `SELECT user_id, display_name, pgp_sym_decrypt_bytea(password, $1::TEXT) AS password
             FROM users
             WHERE users.username = $2::VARCHAR;`,
          [this.dbSecret, login],
        );
        if (maybeRow === undefined) {
          throw new Error(`UserNotFound: User not found for the username: ${login}`);
        }
        row = maybeRow;
        break;
      }
      default:
        throw new Error("AssertionError: Invalid `creddentials.login` type");
    }

    if (row.password === null) {
      throw new Error("NoPassword: Password authentication is not available for this user");
    }

    const isMatch: boolean = await this.password.verify(row.password, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidPassword");
    }

    const session: Session = await this.createSession(queryable, row.user_id);
    const user = await this.getExistingUserById(queryable, session.user.id);

    return {user, session};
  }

  private async createUser(
    queryable: Queryable,
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
    passwordHash: PasswordHash,
  ): Promise<User> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const userId: UuidHex = this.uuidGen.next();
    const userRow: Row = await queryable.one(
      `WITH administrator_exists AS (SELECT 1 FROM users WHERE is_administrator)
         INSERT
         INTO users(
           user_id, ctime, display_name,
           email_address, email_address_mtime,
           username, username_mtime,
           password, password_mtime,
           is_administrator
         )
         VALUES (
           $2::UUID, NOW(), $3::VARCHAR,
           (CASE WHEN $4::TEXT IS NULL THEN NULL ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), NOW(),
           $5::VARCHAR, NOW(),
           pgp_sym_encrypt_bytea($6::BYTEA, $1::TEXT), NOW(),
           (NOT EXISTS(SELECT 1 FROM administrator_exists))
         )
         RETURNING user_id, display_name, is_administrator;`,
      [this.dbSecret, userId, displayName, emailAddress, username, passwordHash],
    );

    return {id: userRow.user_id, displayName: userRow.display_name, isAdministrator: userRow.is_administrator};
  }

  private async createValidatedEmailVerification(
    queryable: Queryable,
    userId: UserId,
    email: EmailAddress,
    ctime: Date,
  ): Promise<void> {
    await queryable.countOne(
      `INSERT INTO email_verifications(
        user_id, email_address, ctime, validation_time
      )
         VALUES (
           $2::UUID, pgp_sym_encrypt($3::TEXT, $1::TEXT), $4::TIMESTAMP, NOW()
         );`,
      [this.dbSecret, userId, email, ctime],
    );
  }

  private async createSession(queryable: Queryable, userId: UserId): Promise<Session> {
    type Row = Pick<SessionRow, "ctime"> & Pick<UserRow, "display_name">;

    const sessionId: UuidHex = this.uuidGen.next();

    const row: Row = await queryable.one(
      `INSERT INTO sessions(
        session_id, user_id, ctime, atime, data
      )
         VALUES (
           $1::UUID, $2::UUID, NOW(), NOW(), '{}'
         )
         RETURNING sessions.ctime, (SELECT display_name FROM users WHERE user_id = $2::UUID)`,
      [sessionId, userId],
    );

    return {
      id: sessionId,
      user: {id: userId, displayName: row.display_name},
      ctime: row.ctime,
      atime: row.ctime,
    };
  }

  private async getAndTouchSession(queryable: Queryable, sessionId: SessionId): Promise<Session | null> {
    type Row = Pick<SessionRow, "ctime" | "atime" | "user_id"> & Pick<UserRow, "display_name">;

    const row: Row | undefined = await queryable.oneOrNone(
      `UPDATE sessions
         SET atime = NOW()
         WHERE session_id = $1::UUID
         RETURNING sessions.ctime, sessions.atime, sessions.user_id, (SELECT display_name FROM users WHERE user_id = sessions.user_id)`,
      [sessionId],
    );

    if (row === undefined) {
      return null;
    }

    return {
      id: sessionId,
      user: {id: row.user_id, displayName: row.display_name},
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  private async getExistingUserById(queryable: Queryable, userId: UserId): Promise<User> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row = await queryable.one(
      `SELECT user_id, display_name, is_administrator
         FROM users
         WHERE users.user_id = $1::UUID;`,
      [userId],
    );
    return {id: row.user_id, displayName: row.display_name, isAdministrator: row.is_administrator};
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
      this.tokenSecret,
    );
    if (typeof tokenObj !== "object" || tokenObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $EmailRegistrationJwt.read(JSON_VALUE_READER, tokenObj);
  }
}
