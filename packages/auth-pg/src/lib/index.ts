import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials.js";
import {
  dinoparcToUserDisplayName,
  hammerfestToUserDisplayName,
  readLogin,
  twinoidToUserDisplayName
} from "@eternal-twin/core/lib/auth/helpers.js";
import { Login } from "@eternal-twin/core/lib/auth/login.js";
import { LoginType } from "@eternal-twin/core/lib/auth/login-type.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/core/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { Session } from "@eternal-twin/core/lib/auth/session.js";
import { SessionId } from "@eternal-twin/core/lib/auth/session-id.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { $UserAndSession, UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials.js";
import { $UserLogin, UserLogin } from "@eternal-twin/core/lib/auth/user-login.js";
import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client.js";
import { DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/core/lib/email/service.js";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { DEFAULT_USER_FIELDS } from "@eternal-twin/core/lib/user/default-user-fields.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SHORT_USER_FIELDS } from "@eternal-twin/core/lib/user/short-user-fields.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/core/lib/user/username.js";
import {
  OauthAccessTokenRow,
  OauthClientRow,
  SessionRow,
  UserRow,
} from "@eternal-twin/etwin-pg/lib/schema.js";
import { Database, Queryable, TransactionMode } from "@eternal-twin/pg-db";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/lib/client.js";
import { User as TidUser } from "@eternal-twin/twinoid-core/lib/user.js";
import jsonWebToken from "jsonwebtoken";
import { UuidHex } from "kryo/lib/uuid-hex.js";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";

import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

export interface PgAuthServiceOptions {
  database: Database;
  databaseSecret: string;
  dinoparcStore: DinoparcStore;
  dinoparcClient: DinoparcClient;
  email: EmailService;
  emailTemplate: EmailTemplateService;
  hammerfestStore: HammerfestStore;
  hammerfestClient: HammerfestClient;
  link: LinkService;
  oauthProvider: OauthProviderService;
  password: PasswordService;
  userStore: UserStore;
  tokenSecret: Uint8Array;
  twinoidStore: TwinoidStore;
  twinoidClient: TwinoidClientService;
  uuidGenerator: UuidGenerator;
}

export class PgAuthService implements AuthService {
  readonly #database: Database;
  readonly #dbSecret: string;
  readonly #dinoparcStore: DinoparcStore;
  readonly #dinoparcClient: DinoparcClient;
  readonly #email: EmailService;
  readonly #emailTemplate: EmailTemplateService;
  readonly #hammerfestStore: HammerfestStore;
  readonly #hammerfestClient: HammerfestClient;
  readonly #link: LinkService;
  readonly #oauthProvider: OauthProviderService;
  readonly #password: PasswordService;
  readonly #userStore: UserStore;
  readonly #tokenSecret: Buffer;
  readonly #twinoidStore: TwinoidStore;
  readonly #twinoidClient: TwinoidClientService;
  readonly #uuidGen: UuidGenerator;

  readonly #defaultLocale: LocaleId;

  /**
   * Creates a new authentication service.
   */
  constructor(options: Readonly<PgAuthServiceOptions>) {
    this.#database = options.database;
    this.#dbSecret = options.databaseSecret;
    this.#dinoparcStore = options.dinoparcStore;
    this.#dinoparcClient = options.dinoparcClient;
    this.#email = options.email;
    this.#emailTemplate = options.emailTemplate;
    this.#hammerfestStore = options.hammerfestStore;
    this.#hammerfestClient = options.hammerfestClient;
    this.#link = options.link;
    this.#oauthProvider = options.oauthProvider;
    this.#password = options.password;
    this.#userStore = options.userStore;
    this.#tokenSecret = Buffer.from(options.tokenSecret);
    this.#twinoidStore = options.twinoidStore;
    this.#twinoidClient = options.twinoidClient;
    this.#uuidGen = options.uuidGenerator;
    this.#defaultLocale = "en-US";
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
    const emailLocale: LocaleId = options.locale ?? this.#defaultLocale;
    const emailContent = await this.#emailTemplate.verifyRegistrationEmail(emailLocale, token);
    await this.#email.sendEmail(options.email, emailContent);
  }

  async registerWithVerifiedEmail(
    acx: AuthContext,
    options: RegisterWithVerifiedEmailOptions,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }

    const emailJwt: EmailRegistrationJwt = await this.readEmailVerificationToken(options.emailToken);
    const email: EmailAddress = emailJwt.email;

    const oldUser: ShortUser | null = await this.#userStore.getUser({ref: {email}, fields: SHORT_USER_FIELDS});
    if (oldUser !== null) {
      throw new Error(`Conflict: EmailAddressAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.#password.hash(options.password);
    const user: SimpleUser = await this.#userStore.createUser({displayName, email, username: null});

    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.setPasswordHashRw(q, user.id, passwordHash);
      try {
        await this.createValidatedEmailVerification(q, user.id, email, new Date(emailJwt.issuedAt * 1000));
      } catch (err) {
        console.warn(`FailedToCreateEmailVerification\n${err.stack}`);
      }

      const session: Session = await this.createSession(q, user.id);

      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
  }

  async registerWithUsername(acx: AuthContext, options: RegisterWithUsernameOptions): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }

    const username: Username = options.username;
    const oldUser: ShortUser | null = await this.#userStore.getUser({ref: {username}, fields: SHORT_USER_FIELDS});
    if (oldUser !== null) {
      throw new Error(`Conflict: UsernameAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.#password.hash(options.password);
    const user: SimpleUser = await this.#userStore.createUser({displayName, email: null, username});

    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      await this.setPasswordHashRw(q, user.id, passwordHash);
      const session: Session = await this.createSession(q, user.id);
      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
  }

  async loginWithCredentials(acx: AuthContext, credentials: UserCredentials): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can log in");
    }
    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.loginWithCredentialsTx(q, acx, credentials);
    });
  }

  async registerOrLoginWithDinoparc(
    acx: AuthContext,
    credentials: DinoparcCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const dparcSession: DinoparcSession = await this.#dinoparcClient.createSession(credentials);
    const link: VersionedEtwinLink = await this.#link.getLinkFromDinoparc(dparcSession.user.server, dparcSession.user.id);
    let userId: UserId;
    if (link.current !== null) {
      // TODO: Check that the user is active, otherwise unlink and create a new user
      userId = link.current.user.id;
    } else {
      const displayName = dinoparcToUserDisplayName(dparcSession.user);
      const user = await this.#userStore.createUser({displayName, email: null, username: null});
      try {
        await this.#dinoparcStore.touchShortUser(dparcSession.user);
        await this.#link.linkToDinoparc({
          userId: user.id,
          dinoparcServer: dparcSession.user.server,
          dinoparcUserId: dparcSession.user.id,
          linkedBy: user.id,
        });
      } catch (e) {
        // Delete user because without a link it is impossible to authenticate as this user.
        // If the exception comes from `hammerfestArchive.createOrUpdateUseRef`, the changes are fully reverted.
        // If the exception comes from `link.linkToHammerfest`, the archived user remains: it's OK (no link is created).
        // If `hardDeleteUserRw` fails, we are left with an orphan user: it should be collected but does not cause
        // any issues.
        await this.#userStore.hardDeleteUserById(user.id);
        throw e;
      }
      userId = user.id;
    }
    const result: UserAndSession = await this.#database.transaction(TransactionMode.ReadWrite, async queryable => {
      const session: Session = await this.createSession(queryable, userId);
      const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: UserNotFound");
      }
      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
    // At this point the authentication is complete, we may still use the Hammerfest session to improve our archive but
    // errors should not prevent the authentication.
    // try {
    //   this.hammerfest.archiveSession(hfSession)
    // } catch (e) {
    //   console.warn(e);
    // }
    return result;
  }

  async registerOrLoginWithHammerfest(
    acx: AuthContext,
    credentials: HammerfestCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const hfSession: HammerfestSession = await this.#hammerfestClient.createSession(credentials);
    const link: VersionedEtwinLink = await this.#link.getLinkFromHammerfest(hfSession.user.server, hfSession.user.id);
    let userId: UserId;
    if (link.current !== null) {
      // TODO: Check that the user is active, otherwise unlink and create a new user
      userId = link.current.user.id;
    } else {
      const displayName = hammerfestToUserDisplayName(hfSession.user);
      const user = await this.#userStore.createUser({displayName, email: null, username: null});
      try {
        await this.#hammerfestStore.touchShortUser(hfSession.user);
        await this.#link.linkToHammerfest({
          userId: user.id,
          hammerfestServer: hfSession.user.server,
          hammerfestUserId: hfSession.user.id,
          linkedBy: user.id,
        });
      } catch (e) {
        // Delete user because without a link it is impossible to authenticate as this user.
        // If the exception comes from `hammerfestArchive.createOrUpdateUseRef`, the changes are fully reverted.
        // If the exception comes from `link.linkToHammerfest`, the archived user remains: it's OK (no link is created).
        // If `hardDeleteUserRw` fails, we are left with an orphan user: it should be collected but does not cause
        // any issues.
        await this.#userStore.hardDeleteUserById(user.id);
        throw e;
      }
      userId = user.id;
    }
    const result: UserAndSession = await this.#database.transaction(TransactionMode.ReadWrite, async queryable => {
      const session: Session = await this.createSession(queryable, userId);
      const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: UserNotFound");
      }
      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
    // At this point the authentication is complete, we may still use the Hammerfest session to improve our archive but
    // errors should not prevent the authentication.
    // try {
    //   this.hammerfest.archiveSession(hfSession)
    // } catch (e) {
    //   console.warn(e);
    // }
    return result;
  }

  async registerOrLoginWithTwinoidOauth(acx: AuthContext, at: RfcOauthAccessTokenKey): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const tidUser: Pick<TidUser, "id" | "name"> = await this.#twinoidClient.getMe(at);
    const link: VersionedEtwinLink = await this.#link.getLinkFromTwinoid(tidUser.id.toString(10));
    let userId: UserId;
    if (link.current !== null) {
      // TODO: Check that the user is active, otherwise unlink and create a new user
      userId = link.current.user.id;
    } else {
      const displayName = twinoidToUserDisplayName(tidUser);
      const user = await this.#userStore.createUser({displayName, email: null, username: null});
      try {
        await this.#twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: tidUser.id.toString(10), displayName: tidUser.name});
        await this.#link.linkToTwinoid({
          userId: user.id,
          twinoidUserId: tidUser.id.toString(10),
          linkedBy: user.id,
        });
      } catch (e) {
        // Delete user because without a link it is impossible to authenticate as this user.
        // If the exception comes from `twinoidArchive.createOrUpdateUseRef`, the changes are fully reverted.
        // If the exception comes from `link.linkToTwinoid`, the archived user remains: it's OK (no link is created).
        // If `hardDeleteUserRw` fails, we are left with an orphan user: it should be collected but does not cause
        // any issues.
        await this.#userStore.hardDeleteUserById(user.id);
        throw e;
      }
      userId = user.id;
    }
    const result: UserAndSession = await this.#database.transaction(TransactionMode.ReadWrite, async queryable => {
      const session: Session = await this.createSession(queryable, userId);
      const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: UserNotFound");
      }
      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
    return result;
  }

  async authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    return this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      const session: Session | null = await this.getAndTouchSession(q, sessionId);
      if (session === null) {
        return null;
      }

      const user = await this.#userStore.getUser({ref: {id: session.user.id}, fields: DEFAULT_USER_FIELDS});
      if (user === null) {
        throw new Error("AssertionError: UserNotFound");
      }

      return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
    });
  }

  public async authenticateAccessToken(token: RfcOauthAccessTokenKey): Promise<AuthContext> {
    return await this.#database.transaction(TransactionMode.ReadWrite, async (q: Queryable) => {
      return this.authenticateAccessTokenTx(q, token);
    });
  }

  public async authenticateAccessTokenTx(queryable: Queryable, token: RfcOauthAccessTokenKey): Promise<AuthContext> {
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
    if (atimeRow.atime.getTime() < row.ctime.getTime()) {
      throw new Error("AssertionError: Expectected access time to be greated than or equal to creation time");
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
        displayName: {current: {value: row.user_display_name}},
      }
    };
  }

  public async authenticateCredentials(credentials: Credentials): Promise<AuthContext> {
    const login: Login = readLogin(credentials.login);
    switch (login.type) {
      case LoginType.OauthClientKey: {
        const client: OauthClient | null = await this.#oauthProvider.getClientByIdOrKey(SYSTEM_AUTH, login.value);
        if (client === null) {
          throw new Error(`OauthClientNotFound: Client not found for the id or key: ${credentials.login}`);
        }
        return this.innerAuthenticateClientCredentials(client, credentials.password);
      }
      case LoginType.Uuid: {
        const [client, user] = await Promise.all([
          this.#oauthProvider.getClientByIdOrKey(SYSTEM_AUTH, login.value),
          this.#userStore.getUser({ref: {id: login.value}, fields: SHORT_USER_FIELDS}),
        ]);
        if (client !== null) {
          if (user !== null) {
            throw new Error("AssertionError: Expected only `client` to be non-null");
          }
          return this.innerAuthenticateClientCredentials(client, credentials.password);
        } else if (user !== null) {
          throw new Error("NotImplemented");
        } else {
          throw new Error(`NotFound: no client or user for the id ${login.value}`);
        }
      }
      default: {
        throw new Error("NotImplemented");
      }
    }
  }

  private async innerAuthenticateClientCredentials(client: OauthClient, password: Uint8Array): Promise<AuthContext> {
    const isMatch: boolean = await this.#oauthProvider.verifyClientSecret(SYSTEM_AUTH, client.id, password);

    if (!isMatch) {
      throw new Error("InvalidSecret");
    }

    return {
      type: AuthType.OauthClient,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: client.id,
        key: client.key,
        displayName: client.displayName,
      },
    };
  }

  private async loginWithCredentialsTx(
    queryable: Queryable,
    acx: AuthContext,
    credentials: UserCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const login: UserLogin = credentials.login;
    type Row = Pick<UserRow, "user_id" | "display_name">;
    let row: Row;
    switch ($UserLogin.match(credentials.login)) {
      case $EmailAddress: {
        // TODO: Compute email hash
        throw new Error("NotImplemented");
        // const maybeRow: Row | undefined = await queryable.oneOrNone(
        //   `
        //   SELECT user_id, display_name
        //   FROM users
        //   WHERE users.email_address = pgp_sym_encrypt($2::TEXT, $1::TEXT);`,
        //   [this.dbSecret, login],
        // );
        // if (maybeRow === undefined) {
        //   throw new Error(`UserNotFound: User not found for the email: ${login}`);
        // }
        // row = maybeRow;
        // break;
      }
      case $Username: {
        const maybeRow: Row | undefined = await queryable.oneOrNone(
          `
          SELECT user_id, display_name
          FROM users
          WHERE users.username = $1::VARCHAR;`,
          [login],
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

    const passwordHash: PasswordHash | null = await this.getPasswordHashRo(queryable, row.user_id);
    if (passwordHash === null) {
      throw new Error("NoPassword: Password authentication is not available for this user");
    }

    const isMatch: boolean = await this.#password.verify(passwordHash, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidPassword");
    }

    const session: Session = await this.createSession(queryable, row.user_id);
    const user = await this.#userStore.getUser({ref: {id: row.user_id}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
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
        $2::UUID, pgp_sym_encrypt($3::TEXT, $1::TEXT), $4::INSTANT, NOW()
      );`,
      [this.#dbSecret, userId, email, ctime],
    );
  }

  private async createSession(queryable: Queryable, userId: UserId): Promise<Session> {
    type Row = Pick<SessionRow, "ctime"> & Pick<UserRow, "display_name">;

    const sessionId: UuidHex = this.#uuidGen.next();

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
      user: {type: ObjectType.User, id: userId, displayName: {current: {value: row.display_name}}},
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
      user: {type: ObjectType.User, id: row.user_id, displayName: {current: {value: row.display_name}}},
      ctime: row.ctime,
      atime: row.atime,
    };
  }

  private async createEmailVerificationToken(emailAddress: EmailAddress): Promise<string> {
    const payload: Omit<EmailRegistrationJwt, "issuedAt" | "expirationTime"> = {
      email: emailAddress,
    };

    return jsonWebToken.sign(
      payload,
      this.#tokenSecret,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      },
    );
  }

  private async readEmailVerificationToken(token: string): Promise<EmailRegistrationJwt> {
    const tokenObj: object | string = jsonWebToken.verify(
      token,
      this.#tokenSecret,
    );
    if (typeof tokenObj !== "object" || tokenObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $EmailRegistrationJwt.read(JSON_VALUE_READER, tokenObj);
  }

  private async setPasswordHashRw(queryable: Queryable, userId: UserId, passwordHash: PasswordHash): Promise<void> {
    await queryable.countOne(
      `
          UPDATE users
          SET password = pgp_sym_encrypt_bytea($3::BYTEA, $1::TEXT), password_mtime = NOW()
          WHERE user_id = $2::UUID;`,
      [this.#dbSecret, userId, passwordHash],
    );
  }

  private async getPasswordHashRo(queryable: Queryable, userId: UserId): Promise<PasswordHash | null> {
    type Row = Pick<UserRow, "password">;
    const row: Row | undefined = await queryable.oneOrNone(
      `
          SELECT pgp_sym_decrypt_bytea(password, $1::TEXT) AS password
          FROM users
          WHERE user_id = $2::UUID;`,
      [this.#dbSecret, userId],
    );
    return row !== undefined ? row.password : null;
  }

  public async hasPassword(userId: UserId): Promise<boolean> {
    type Row = {has_password: boolean};
    const row: Row | undefined = await this.#database.oneOrNone(
      `
          SELECT (password IS NOT NULL) as has_password
          FROM users
          WHERE user_id = $1::UUID;`,
      [userId],
    );
    return row !== undefined ? row.has_password : false;
  }
}
