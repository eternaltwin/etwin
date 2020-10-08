import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials";
import { LinkHammerfestUserOptions } from "@eternal-twin/core/lib/auth/link-hammerfest-user-options.js";
import { $Login, Login } from "@eternal-twin/core/lib/auth/login.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/core/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { SessionId } from "@eternal-twin/core/lib/auth/session-id.js";
import { Session } from "@eternal-twin/core/lib/auth/session.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/core/lib/email/service.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { User } from "@eternal-twin/core/lib/user/user";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/core/lib/user/username.js";
import {
  HammerfestUserLinkRow,
  OauthAccessTokenRow,
  OauthClientRow,
  SessionRow,
  TwinoidUserLinkRow,
  UserRow,
} from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/lib/client.js";
import { User as TidUser } from "@eternal-twin/twinoid-core/lib/user.js";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";

export class PgAuthService implements AuthService {
  private readonly database: Database;
  private readonly dbSecret: string;
  private readonly uuidGen: UuidGenerator;
  private readonly password: PasswordService;
  private readonly email: EmailService;
  private readonly emailTemplate: EmailTemplateService;
  private readonly defaultLocale: LocaleId;
  private readonly tokenSecret: Buffer;
  private readonly hammerfest: HammerfestClientService;
  private readonly twinoidClient: TwinoidClientService;

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
   * @param hammerfest Hammerfest service to use.
   * @param twinoidClient Twinoid API service to use.
   */
  constructor(
    database: Database,
    dbSecret: string,
    uuidGen: UuidGenerator,
    password: PasswordService,
    email: EmailService,
    emailTemplate: EmailTemplateService,
    tokenSecret: Uint8Array,
    hammerfest: HammerfestClientService,
    twinoidClient: TwinoidClientService,
  ) {
    this.database = database;
    this.dbSecret = dbSecret;
    this.uuidGen = uuidGen;
    this.password = password;
    this.email = email;
    this.emailTemplate = emailTemplate;
    this.tokenSecret = Buffer.from(tokenSecret);
    this.hammerfest = hammerfest;
    this.twinoidClient = twinoidClient;
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

  async registerOrLoginWithHammerfest(
    acx: AuthContext,
    credentials: HammerfestCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    return await this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.registerOrLoginWithHammerfestTx(q, acx, credentials);
    });
  }

  async registerOrLoginWithTwinoidOauth(acx: AuthContext, at: OauthAccessTokenKey): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    return await this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.registerOrLoginWithTwinoidOauthTx(q, acx, at);
    });
  }

  async linkHammerfestUser(_acx: AuthContext, _options: LinkHammerfestUserOptions): Promise<void> {
    throw new Error("NotImplemented");
  }

  async authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
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

  public async authenticateAccessToken(token: OauthAccessTokenKey): Promise<AuthContext> {
    return await this.database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.authenticateAccessTokenTx(q, token);
    });
  }

  public async authenticateAccessTokenTx(queryable: Queryable, token: OauthAccessTokenKey): Promise<AuthContext> {
    type Row = Pick<OauthAccessTokenRow, "ctime" | "atime" | "user_id" | "oauth_client_id">
      & {user_display_name: UserRow["display_name"], oauth_client_display_name: OauthClientRow["display_name"], oauth_client_key: OauthClientRow["key"]};

    const row: Row | undefined = await queryable.oneOrNone(
      `
      SELECT oauth_access_tokens.ctime, oauth_access_tokens.atime,
        oauth_access_tokens.user_id, oauth_access_tokens.oauth_client_id,
        users.display_name AS user_display_name, oauth_clients.display_name AS oauth_client_display_name, oauth_clients.key AS oauth_client_key
      FROM oauth_access_tokens
        INNER JOIN users USING(user_id)
        INNER JOIN oauth_clients USING(oauth_client_id)
      WHERE oauth_access_token_id = $1::UUID;`,
      [token],
    );

    if (row === undefined) {
      throw new Error("NotFound");
    }

    type AtimeRow = Pick<OauthAccessTokenRow, "atime">;

    const atimeRow: AtimeRow = await queryable.one(
      `
      UPDATE oauth_access_tokens
      SET atime = NOW()
      WHERE oauth_access_token_id = $1::UUID
      RETURNING atime`,
      [token],
    );

    // TODO: Add the access time to the auth context?
    // The assertion below is redundant with the DB constraints, it's there just to use `atimeRow`.
    // The three lines below should be removed once `atimeRow` is used for real.
    if (atimeRow.atime.getTime() > row.ctime.getTime()) {
      throw new Error("AssertionError");
    }

    return {
      type: AuthType.AccessToken,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: row.oauth_client_id,
        key: row.oauth_client_key,
        displayName: row.oauth_client_display_name,
      },
      user: {
        type: ObjectType.User,
        id: row.user_id,
        displayName: row.user_display_name,
      }
    };
  }

  public async authenticateCredentials(credentials: Credentials): Promise<AuthContext> {
    return await this.database.transaction(TransactionMode.ReadOnly, async (q: Queryable) => {
      return this.authenticateCredentialsTx(q, credentials);
    });
  }

  public async authenticateCredentialsTx(queryable: Queryable, credentials: Credentials): Promise<AuthContext> {
    const login: Login = credentials.login;
    type Row = Pick<OauthClientRow, "oauth_client_id" | "key" | "display_name" | "secret">;
    let row: Row;
    if ($UuidHex.test(login)) {
      const maybeRow: Row | undefined = await queryable.oneOrNone(
        `
        SELECT oauth_client_id, key, display_name, pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret
        FROM oauth_clients
        WHERE oauth_client_id = $2::UUID;`,
        [this.dbSecret, login],
      );
      if (maybeRow === undefined) {
        throw new Error(`OauthClientNotFound: Client not found for the id: ${login}`);
      }
      row = maybeRow;
    } else {
      const maybeRow: Row | undefined = await queryable.oneOrNone(
        `
        SELECT oauth_client_id, key, display_name, pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret
        FROM oauth_clients
        WHERE key = $2::VARCHAR;`,
        [this.dbSecret, login],
      );
      if (maybeRow === undefined) {
        throw new Error(`OauthClientNotFound: Client not found for the key: ${login}`);
      }
      row = maybeRow;
    }

    const isMatch: boolean = await this.password.verify(row.secret, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidSecret");
    }

    return {
      type: AuthType.OauthClient,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: row.oauth_client_id,
        key: row.key,
        displayName: row.display_name,
      },
    };
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
          `
          SELECT user_id, display_name, pgp_sym_decrypt_bytea(password, $1::TEXT) AS password
          FROM users
          WHERE users.email_address = pgp_sym_encrypt($2::TEXT, $1::TEXT);`,
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
          `
          SELECT user_id, display_name, pgp_sym_decrypt_bytea(password, $1::TEXT) AS password
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
        throw new Error("AssertionError: Invalid `credentials.login` type");
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

  private async registerOrLoginWithHammerfestTx(
    queryable: Queryable,
    acx: AuthContext,
    credentials: HammerfestCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const hfSession: HammerfestSession = await this.hammerfest.createSession(credentials);
    const hfUser: HammerfestUserRef = hfSession.user;
    await this.createOrUpdateHammerfestUser(queryable, hfUser);
    type LinkRow = Pick<HammerfestUserLinkRow, "user_id">;
    const linkRow: LinkRow | undefined = await queryable.oneOrNone(
      `
      SELECT user_id
      FROM hammerfest_user_links
      WHERE hammerfest_server = $1::VARCHAR AND hammerfest_user_id = $2::INT;`,
      [hfUser.server, hfUser.id],
    );
    let userId: UserId;
    if (linkRow !== undefined) {
      userId = linkRow.user_id;
    } else {
      let displayName: UserDisplayName = hfUser.login;
      if (!$UserDisplayName.test(displayName)) {
        displayName = `hf_${displayName}`;
        if (!$UserDisplayName.test(displayName)) {
          displayName = "hammerfestPlayer";
        }
      }
      const user = await this.createUser(queryable, displayName, null, null, null);
      await queryable.countOne(
        `
        INSERT
        INTO hammerfest_user_links(
          user_id, hammerfest_server, hammerfest_user_id, ctime
        )
        VALUES (
          $1::UUID, $2::VARCHAR, $3::INT, NOW()
        );`,
        [user.id, hfUser.server, hfUser.id],
      );
      userId = user.id;
    }

    const session: Session = await this.createSession(queryable, userId);
    const user = await this.getExistingUserById(queryable, session.user.id);

    return {user, session};
  }


  private async registerOrLoginWithTwinoidOauthTx(
    queryable: Queryable,
    acx: AuthContext,
    at: OauthAccessTokenKey,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const tidUser: Partial<TidUser> = await this.twinoidClient.getMe(at);
    await this.createOrUpdateTwinoidUser(queryable, tidUser);
    type LinkRow = Pick<TwinoidUserLinkRow, "user_id">;
    const linkRow: LinkRow | undefined = await queryable.oneOrNone(
      `
      SELECT user_id
      FROM twinoid_user_links
      WHERE twinoid_user_id = $1::INT;`,
      [tidUser.id],
    );
    let userId: UserId;
    if (linkRow !== undefined) {
      userId = linkRow.user_id;
    } else {
      let displayName: UserDisplayName = tidUser.name!;
      if (!$UserDisplayName.test(displayName)) {
        displayName = `tid_${displayName}`;
        if (!$UserDisplayName.test(displayName)) {
          displayName = `tid_${tidUser.id}`;
          if (!$UserDisplayName.test(displayName)) {
            displayName = "twinoidPlayer";
          }
        }
      }
      const user = await this.createUser(queryable, displayName, null, null, null);
      await queryable.countOne(
        `
        INSERT
        INTO twinoid_user_links(
          user_id, twinoid_user_id, ctime
        )
        VALUES (
          $1::UUID, $2::INT, NOW()
        );`,
        [user.id, tidUser.id],
      );
      userId = user.id;
    }

    const session: Session = await this.createSession(queryable, userId);
    const user = await this.getExistingUserById(queryable, session.user.id);

    return {user, session};
  }

  private async createUser(
    queryable: Queryable,
    displayName: UserDisplayName,
    emailAddress: EmailAddress | null,
    username: Username | null,
    passwordHash: PasswordHash | null,
  ): Promise<User> {
    if (!$UserDisplayName.test(displayName)) {
      throw new Error("InvalidDisplayName");
    } else if (username !== null && !$Username.test(username)) {
      throw new Error("InvalidUsername");
    } else if (emailAddress !== null && !$EmailAddress.test(emailAddress)) {
      throw new Error("InvalidEmailAddress");
    }

    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const userId: UuidHex = this.uuidGen.next();
    const userRow: Row = await queryable.one(
      `
      WITH administrator_exists AS (SELECT 1 FROM users WHERE is_administrator)
      INSERT
      INTO users(
        user_id, ctime, display_name, display_name_mtime,
        email_address, email_address_mtime,
        username, username_mtime,
        password, password_mtime,
        is_administrator
      )
      VALUES (
        $2::UUID, NOW(), $3::VARCHAR, NOW(),
        (CASE WHEN $4::TEXT IS NULL THEN NULL ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), NOW(),
        $5::VARCHAR, NOW(),
        pgp_sym_encrypt_bytea($6::BYTEA, $1::TEXT), NOW(),
        (NOT EXISTS(SELECT 1 FROM administrator_exists))
      )
      RETURNING user_id, display_name, is_administrator;`,
      [this.dbSecret, userId, displayName, emailAddress, username, passwordHash],
    );

    return {
      type: ObjectType.User,
      id: userRow.user_id,
      displayName: userRow.display_name,
      isAdministrator: userRow.is_administrator,
    };
  }

  private async createValidatedEmailVerification(
    queryable: Queryable,
    userId: UserId,
    email: EmailAddress,
    ctime: Date,
  ): Promise<void> {
    await queryable.countOne(
      `
      INSERT INTO email_verifications(
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
      `
      INSERT INTO sessions(
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
      user: {type: ObjectType.User, id: userId, displayName: row.display_name},
      ctime: row.ctime,
      atime: row.ctime,
    };
  }

  private async getAndTouchSession(queryable: Queryable, sessionId: SessionId): Promise<Session | null> {
    type Row = Pick<SessionRow, "ctime" | "atime" | "user_id"> & Pick<UserRow, "display_name">;

    const row: Row | undefined = await queryable.oneOrNone(
      `
      UPDATE sessions
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
      user: {type: ObjectType.User, id: row.user_id, displayName: row.display_name},
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  private async getExistingUserById(queryable: Queryable, userId: UserId): Promise<User> {
    type Row = Pick<UserRow, "user_id" | "display_name" | "is_administrator">;
    const row: Row = await queryable.one(
      `
      SELECT user_id, display_name, is_administrator
      FROM users
      WHERE users.user_id = $1::UUID;`,
      [userId],
    );
    return {
      type: ObjectType.User,
      id: row.user_id,
      displayName: row.display_name,
      isAdministrator: row.is_administrator,
    };
  }

  private async createOrUpdateHammerfestUser(queryable: Queryable, hfUserRef: HammerfestUserRef): Promise<void> {
    await queryable.countOne(
      `
      INSERT INTO hammerfest_users(
        server, user_id, username
      )
      VALUES (
        $1::VARCHAR, $2::INT, $3::VARCHAR
      )
      ON CONFLICT (server, user_id)
        DO UPDATE SET username = $3::VARCHAR;`,
      [
        hfUserRef.server,
        hfUserRef.id,
        hfUserRef.login,
      ],
    );
  }

  private async createOrUpdateTwinoidUser(queryable: Queryable, tidUserRef: Partial<TidUser>): Promise<void> {
    await queryable.countOne(
      `
      INSERT INTO twinoid_users(
        user_id, name
      )
      VALUES (
        $1::INT, $2::VARCHAR
      )
      ON CONFLICT (user_id)
        DO UPDATE SET name = $2::VARCHAR;`,
      [
        tidUserRef.id,
        tidUserRef.name,
      ],
    );
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
