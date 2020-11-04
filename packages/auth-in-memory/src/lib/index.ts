import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials.js";
import { readLogin } from "@eternal-twin/core/lib/auth/helpers.js";
import { LoginType } from "@eternal-twin/core/lib/auth/login-type.js";
import { RegisterOrLoginWithEmailOptions } from "@eternal-twin/core/lib/auth/register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { SessionId } from "@eternal-twin/core/lib/auth/session-id.js";
import { Session } from "@eternal-twin/core/lib/auth/session.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials.js";
import { $UserLogin, UserLogin } from "@eternal-twin/core/lib/auth/user-login.js";
import { LocaleId } from "@eternal-twin/core/lib/core/locale-id.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { EmailTemplateService } from "@eternal-twin/core/lib/email-template/service.js";
import { $EmailAddress, EmailAddress } from "@eternal-twin/core/lib/email/email-address.js";
import { EmailService } from "@eternal-twin/core/lib/email/service.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { LinkService } from "@eternal-twin/core/lib/link/service.js";
import { VersionedEtwinLink } from "@eternal-twin/core/lib/link/versioned-etwin-link.js";
import { CompleteOauthAccessToken } from "@eternal-twin/core/lib/oauth/complete-oauth-access-token.js";
import { EtwinOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/etwin-oauth-access-token-key.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/core/lib/user/username.js";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/src/lib/client.js";
import { User as TidUser } from "@eternal-twin/twinoid-core/src/lib/user.js";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { UuidHex } from "kryo/lib/uuid-hex.js";

import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";

interface EmailVerification {
  userId: UserId;
  emailAddress: EmailAddress;
  ctime: Date;
  validationTime: Date;
}

const SYSTEM_AUTH: SystemAuthContext = {
  type: AuthType.System,
  scope: AuthScope.Default,
};

export interface InMemoryAuthServiceOptions {
  email: EmailService,
  emailTemplate: EmailTemplateService,
  hammerfestArchive: HammerfestArchiveService,
  hammerfestClient: HammerfestClientService,
  link: LinkService,
  oauthProvider: OauthProviderService,
  password: PasswordService,
  simpleUser: SimpleUserService,
  tokenSecret: Uint8Array,
  twinoidArchive: TwinoidArchiveService,
  twinoidClient: TwinoidClientService,
  uuidGenerator: UuidGenerator,
}

export class InMemoryAuthService implements AuthService {
  private readonly email: EmailService;
  private readonly emailTemplate: EmailTemplateService;
  private readonly hammerfestArchive: HammerfestArchiveService;
  private readonly hammerfestClient: HammerfestClientService;
  private readonly link: LinkService;
  private readonly oauthProvider: OauthProviderService;
  private readonly password: PasswordService;
  private readonly simpleUser: SimpleUserService;
  private readonly tokenSecret: Buffer;
  private readonly twinoidArchive: TwinoidArchiveService;
  private readonly twinoidClient: TwinoidClientService;
  private readonly uuidGen: UuidGenerator;

  private readonly defaultLocale: LocaleId;

  private readonly emailVerifications: Set<EmailVerification>;
  private readonly passwordHashes: Map<UserId, PasswordHash>;
  private readonly sessions: Map<SessionId, Session>;

  /**
   * Creates a new authentication service.
   */
  constructor(options: Readonly<InMemoryAuthServiceOptions>) {
    this.email = options.email;
    this.emailTemplate = options.emailTemplate;
    this.hammerfestArchive = options.hammerfestArchive;
    this.hammerfestClient = options.hammerfestClient;
    this.link = options.link;
    this.oauthProvider = options.oauthProvider;
    this.password = options.password;
    this.simpleUser = options.simpleUser;
    this.tokenSecret = Buffer.from(options.tokenSecret);
    this.twinoidArchive = options.twinoidArchive;
    this.twinoidClient = options.twinoidClient;
    this.uuidGen = options.uuidGenerator;
    this.defaultLocale = "en-US";

    this.emailVerifications = new Set();
    this.passwordHashes = new Map();
    this.sessions = new Map();
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

    const emailJwt: EmailRegistrationJwt = await this.readEmailVerificationToken(options.emailToken);
    const email: EmailAddress = emailJwt.email;

    const oldUser: ShortUser | null = await this.simpleUser.getShortUserByEmail(SYSTEM_AUTH, {email});
    if (oldUser !== null) {
      throw new Error(`Conflict: EmailAddressAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const user: SimpleUser = await this.simpleUser.createUser(SYSTEM_AUTH, {displayName, email, username: null});
    this.setPasswordHash(user.id, passwordHash);

    try {
      await this.createValidatedEmailVerification(user.id, email, new Date(emailJwt.issuedAt * 1000));
    } catch (err) {
      console.warn(`FailedToCreateEmailVerification\n${err.stack}`);
    }

    const session: Session = await this.createSession(user.id);

    return {user, session};
  }

  async registerWithUsername(acx: AuthContext, options: RegisterWithUsernameOptions): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }

    const username: Username = options.username;
    const oldUser: ShortUser | null = await this.simpleUser.getShortUserByUsername(SYSTEM_AUTH, {username});
    if (oldUser !== null) {
      throw new Error(`Conflict: UsernameAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const user: SimpleUser = await this.simpleUser.createUser(SYSTEM_AUTH, {displayName, email: null, username});
    this.setPasswordHash(user.id, passwordHash);

    const session: Session = await this.createSession(user.id);

    return {user, session};
  }

  async loginWithCredentials(acx: AuthContext, credentials: UserCredentials): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const login: UserLogin = credentials.login;
    let imUser: ShortUser;
    switch ($UserLogin.match(credentials.login)) {
      case $EmailAddress: {
        const maybeImUser: ShortUser | null = await this.simpleUser.getShortUserByEmail(SYSTEM_AUTH, {email: login});
        if (maybeImUser === null) {
          throw new Error(`UserNotFound: User not found for the email: ${login}`);
        }
        imUser = maybeImUser;
        break;
      }
      case $Username: {
        const maybeImUser: ShortUser | null = await this.simpleUser.getShortUserByUsername(SYSTEM_AUTH, {username: login});
        if (maybeImUser === null) {
          throw new Error(`UserNotFound: User not found for the username: ${login}`);
        }
        imUser = maybeImUser;
        break;
      }
      default:
        throw new Error("AssertionError: Invalid `credentials.login` type");
    }
    const passwordHash: PasswordHash | null = this.getPasswordHash(imUser.id);
    if (passwordHash === null) {
      throw new Error("NoPassword: Password authentication is not available for this user");
    }

    const isMatch: boolean = await this.password.verify(passwordHash, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidPassword");
    }

    const session: Session = await this.createSession(imUser.id);
    const user: SimpleUser = await this.getExistingUserById(imUser.id);

    return {user, session};
  }

  async registerOrLoginWithHammerfest(
    acx: AuthContext,
    credentials: HammerfestCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const hfSession: HammerfestSession = await this.hammerfestClient.createSession(credentials);
    const hfUser: ShortHammerfestUser = hfSession.user;
    await this.hammerfestArchive.touchShortUser(hfUser);

    const link: VersionedEtwinLink = await this.link.getLinkFromHammerfest(hfUser.server, hfUser.id);

    let userId: UserId;
    if (link.current !== null) {
      userId = link.current.user.id;
    } else {
      let displayName: UserDisplayName = hfUser.username;
      if (!$UserDisplayName.test(displayName)) {
        displayName = `hf_${displayName}`;
        if (!$UserDisplayName.test(displayName)) {
          displayName = "hammerfestPlayer";
        }
      }
      const user = await this.simpleUser.createUser(SYSTEM_AUTH, {displayName, email: null, username: null});
      await this.link.linkToHammerfest(user.id, hfUser.server, hfUser.id);
      userId = user.id;
    }

    const session: Session = await this.createSession(userId);
    const user = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  async registerOrLoginWithTwinoidOauth(acx: AuthContext, at: RfcOauthAccessTokenKey): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const tidUser: Partial<TidUser> = await this.twinoidClient.getMe(at);
    await this.twinoidArchive.createOrUpdateUserRef({type: ObjectType.TwinoidUser, id: tidUser.id!.toString(10), displayName: tidUser.name!});

    const link: VersionedEtwinLink = await this.link.getLinkFromTwinoid(tidUser.id!.toString(10));

    let userId: UserId;
    if (link.current !== null) {
      userId = link.current.user.id;
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
      const user = await this.simpleUser.createUser(SYSTEM_AUTH, {displayName, email: null, username: null});
      await this.link.linkToTwinoid(user.id, tidUser.id!.toString(10));
      userId = user.id;
    }

    const session: Session = await this.createSession(userId);
    const user = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  async authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    const session: Session | null = await this.getAndTouchSession(sessionId);
    if (session === null) {
      return null;
    }

    const user: SimpleUser = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  public async authenticateAccessToken(tokenKey: EtwinOauthAccessTokenKey): Promise<AuthContext> {
    const token: CompleteOauthAccessToken | null = await this.oauthProvider.getAccessTokenByKey(SYSTEM_AUTH, tokenKey);
    if (token === null) {
      throw new Error("NotFound");
    }
    return {
      type: AuthType.AccessToken,
      scope: AuthScope.Default,
      client: token.client,
      user: token.user,
    };
  }

  public async authenticateCredentials(credentials: Credentials): Promise<AuthContext> {
    const login = readLogin(credentials.login);
    switch (login.type) {
      case LoginType.OauthClientKey: {
        const client: OauthClient | null = await this.oauthProvider.getClientByIdOrKey(SYSTEM_AUTH, login.value);
        if (client === null) {
          throw new Error(`OauthClientNotFound: Client not found for the id or key: ${credentials.login}`);
        }
        return this.innerAuthenticateClientCredentials(client, credentials.password);
      }
      case LoginType.Uuid: {
        const [client, user] = await Promise.all([
          this.oauthProvider.getClientByIdOrKey(SYSTEM_AUTH, login.value),
          this.simpleUser.getShortUserById(SYSTEM_AUTH, {id: login.value}),
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
    const isMatch: boolean = await this.oauthProvider.verifyClientSecret(SYSTEM_AUTH, client.id, password);

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

  private async getAndTouchSession(sessionId: SessionId): Promise<Session | null> {
    const session: Session | undefined = this.sessions.get(sessionId);
    if (session === undefined) {
      return null;
    }

    session.atime = new Date();

    return {
      ...session,
      user: {...session.user},
    };
  }
  private async createValidatedEmailVerification(
    userId: UserId,
    email: EmailAddress,
    ctime: Date,
  ): Promise<void> {
    const emailVerification: EmailVerification = {
      userId,
      emailAddress: email,
      ctime,
      validationTime: new Date(),
    };

    this.emailVerifications.add(emailVerification);
  }

  private async createSession(userId: UserId): Promise<Session> {
    const user: SimpleUser | null = await this.simpleUser.getUserById(SYSTEM_AUTH, {id: userId});
    if (user === null) {
      throw new Error("UserNotFound");
    }

    const sessionId: UuidHex = this.uuidGen.next();
    const time: number = Date.now();
    const session: Session = {
      id: sessionId,
      ctime: new Date(time),
      atime: new Date(time),
      user: {type: ObjectType.User, id: userId, displayName: user.displayName}
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private async getExistingUserById(userId: UserId): Promise<SimpleUser> {
    const user: SimpleUser | null = await this.simpleUser.getUserById(SYSTEM_AUTH, {id: userId});

    if (user === null) {
      throw new Error(`AssertionError: Expected user to exist for id ${userId}`);
    }

    return {
      type: ObjectType.User,
      id: user.id,
      displayName: user.displayName,
      isAdministrator: user.isAdministrator,
    };
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

  private setPasswordHash(userId: UserId, passwordHash: PasswordHash): void {
    this.passwordHashes.set(userId, passwordHash);
  }

  private getPasswordHash(userId: UserId): PasswordHash | null {
    return this.passwordHashes.get(userId) ?? null;
  }

  public async hasPassword(userId: UserId): Promise<boolean> {
    return this.passwordHashes.has(userId);
  }
}
