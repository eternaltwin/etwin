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
import { HammerfestLogin } from "@eternal-twin/core/lib/hammerfest/hammerfest-login";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { User } from "@eternal-twin/core/lib/user/user";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $Username, Username } from "@eternal-twin/core/lib/user/username.js";
import {
  InMemoryAccessToken,
  InMemoryOauthClient,
  InMemoryOauthProviderService,
} from "@eternal-twin/oauth-provider-in-memory";
import { TwinoidClientService } from "@eternal-twin/twinoid-core/src/lib/client.js";
import { User as TidUser } from "@eternal-twin/twinoid-core/src/lib/user.js";
import { InMemoryUser, InMemoryUserService } from "@eternal-twin/user-in-memory";
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

interface InMemoryHammerfestUser {
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestLogin;
}

interface InMemoryHammerfestUserLink {
  userId: UserId;
  hfServer: HammerfestServer;
  hfId: HammerfestUserId;
  ctime: Date;
}

interface InMemoryTwinoidUser {
  id: number;
  name: string;
}

interface InMemoryTwinoidUserLink {
  userId: UserId;
  tidId: number;
  ctime: Date;
}

export class InMemoryAuthService implements AuthService {
  private readonly uuidGen: UuidGenerator;
  private readonly password: PasswordService;
  private readonly email: EmailService;
  private readonly emailTemplate: EmailTemplateService;
  private readonly defaultLocale: LocaleId;
  private readonly tokenSecret: Buffer;
  private readonly hammerfest: HammerfestClientService;
  private readonly twinoidClient: TwinoidClientService;
  private readonly user: InMemoryUserService;
  private readonly oauthProvider: InMemoryOauthProviderService;

  private readonly sessions: Map<SessionId, Session>;
  private readonly emailVerifications: Set<EmailVerification>;
  private readonly hammerfestUsers: Set<InMemoryHammerfestUser>;
  private readonly hammerfestUserLinks: Set<InMemoryHammerfestUserLink>;
  private readonly twinoidUsers: Set<InMemoryTwinoidUser>;
  private readonly twinoidUserLinks: Set<InMemoryTwinoidUserLink>;

  /**
   * Creates a new authentication service.
   *
   * @param uuidGen UUID generator to use.
   * @param password Password service to use.
   * @param email Email service to use.
   * @param emailTemplate Email template service to use.
   * @param tokenSecret Secret key used to generated and verify tokens.
   * @param hammerfest Hammerfest service to use.
   * @param twinoidClient Twinoid API client service to use.
   * @param user User service to use.
   * @param oauthProvider Oauth provider service to use.
   */
  constructor(
    uuidGen: UuidGenerator,
    password: PasswordService,
    email: EmailService,
    emailTemplate: EmailTemplateService,
    tokenSecret: Uint8Array,
    hammerfest: HammerfestClientService,
    twinoidClient: TwinoidClientService,
    user: InMemoryUserService,
    oauthProvider: InMemoryOauthProviderService,
  ) {
    this.uuidGen = uuidGen;
    this.password = password;
    this.email = email;
    this.emailTemplate = emailTemplate;
    this.tokenSecret = Buffer.from(tokenSecret);
    this.hammerfest = hammerfest;
    this.twinoidClient = twinoidClient;
    this.user = user;
    this.oauthProvider = oauthProvider;
    this.defaultLocale = "en-US";
    this.sessions = new Map();
    this.emailVerifications = new Set();
    this.hammerfestUsers = new Set();
    this.hammerfestUserLinks = new Set();
    this.twinoidUsers = new Set();
    this.twinoidUserLinks = new Set();
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

    const oldUser: InMemoryUser | null = await this.user._getInMemoryUserByEmail(email);
    if (oldUser !== null) {
      throw new Error(`Conflict: EmailAddressAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }


    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const imUser: InMemoryUser = await this.user._createUser(displayName, email, null, passwordHash);
    const user: User = {type: ObjectType.User, id: imUser.id, displayName: imUser.displayName, isAdministrator: imUser.isAdministrator};

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
    const oldUser: InMemoryUser | null = await this.user._getInMemoryUserByUsername(username);
    if (oldUser !== null) {
      throw new Error(`Conflict: UsernameAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.password.hash(options.password);
    const imUser: InMemoryUser = await this.user._createUser(displayName, null, username, passwordHash);
    const user: User = {type: ObjectType.User, id: imUser.id, displayName: imUser.displayName, isAdministrator: imUser.isAdministrator};

    const session: Session = await this.createSession(user.id);

    return {user, session};
  }

  async loginWithCredentials(acx: AuthContext, credentials: Credentials): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const login: Login = credentials.login;
    let imUser: InMemoryUser;
    switch ($Login.match(credentials.login)) {
      case $EmailAddress: {
        const maybeImUser: InMemoryUser | null = await this.user._getInMemoryUserByEmail(login);
        if (maybeImUser === null) {
          throw new Error(`UserNotFound: User not found for the email: ${login}`);
        }
        imUser = maybeImUser;
        break;
      }
      case $Username: {
        const maybeImUser: InMemoryUser | null = await this.user._getInMemoryUserByUsername(login);
        if (maybeImUser === null) {
          throw new Error(`UserNotFound: User not found for the username: ${login}`);
        }
        imUser = maybeImUser;
        break;
      }
      default:
        throw new Error("AssertionError: Invalid `credentials.login` type");
    }
    if (imUser.passwordHash === null) {
      throw new Error("NoPassword: Password authentication is not available for this user");
    }

    const isMatch: boolean = await this.password.verify(imUser.passwordHash, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidPassword");
    }

    const session: Session = await this.createSession(imUser.id);
    const user: User = {type: ObjectType.User, id: imUser.id, displayName: imUser.displayName, isAdministrator: imUser.isAdministrator};

    return {user, session};
  }

  async registerOrLoginWithHammerfest(
    acx: AuthContext,
    credentials: HammerfestCredentials,
  ): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const hfSession: HammerfestSession = await this.hammerfest.createSession(credentials);
    const hfUser: HammerfestUserRef = hfSession.user;
    await this.createOrUpdateHammerfestUser(hfUser);

    let link: InMemoryHammerfestUserLink | undefined;
    for (const hfLink of this.hammerfestUserLinks) {
      if (hfLink.hfServer === hfUser.server && hfLink.hfId === hfUser.id) {
        link = hfLink;
        break;
      }
    }

    let userId: UserId;
    if (link !== undefined) {
      userId = link.userId;
    } else {
      let displayName: UserDisplayName = hfUser.login;
      if (!$UserDisplayName.test(displayName)) {
        displayName = `hf_${displayName}`;
        if (!$UserDisplayName.test(displayName)) {
          displayName = "hammerfestPlayer";
        }
      }
      const user = await this.user._createUser(displayName, null, null, null);
      const newLink: InMemoryHammerfestUserLink = {
        userId: user.id,
        hfServer: hfUser.server,
        hfId: hfUser.id,
        ctime: new Date(),
      };
      this.hammerfestUserLinks.add(newLink);
      userId = user.id;
    }

    const session: Session = await this.createSession(userId);
    const user = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  async registerOrLoginWithTwinoidOauth(acx: AuthContext, at: OauthAccessTokenKey): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const tidUser: Partial<TidUser> = await this.twinoidClient.getMe(at);
    await this.createOrUpdateTwinoidUser(tidUser);

    let link: InMemoryTwinoidUserLink | undefined;
    for (const tidLink of this.twinoidUserLinks) {
      if (tidLink.tidId === tidUser.id) {
        link = tidLink;
        break;
      }
    }

    let userId: UserId;
    if (link !== undefined) {
      userId = link.userId;
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
      const user = await this.user._createUser(displayName, null, null, null);
      const newLink: InMemoryTwinoidUserLink = {
        userId: user.id,
        tidId: tidUser.id!,
        ctime: new Date(),
      };
      this.twinoidUserLinks.add(newLink);
      userId = user.id;
    }

    const session: Session = await this.createSession(userId);
    const user = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  async linkHammerfestUser(_acx: AuthContext, _options: LinkHammerfestUserOptions): Promise<void> {
    throw new Error("NotImplemented");
  }

  async authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    const session: Session | null = await this.getAndTouchSession(sessionId);
    if (session === null) {
      return null;
    }

    const user: User = await this.getExistingUserById(session.user.id);

    return {user, session};
  }

  public async authenticateAccessToken(token: OauthAccessTokenKey): Promise<AuthContext> {
    const imToken: InMemoryAccessToken | null = this.oauthProvider._getInMemoryAccessTokenById(token);
    if (imToken === null) {
      throw new Error("NotFound");
    }
    const client = this.oauthProvider._getInMemoryClientById(imToken.clientId);
    if (client === null) {
      throw new Error("AssertionError: Expected client to exist");
    }
    const user = await this.getExistingUserById(imToken.userId);

    imToken.atime = new Date();

    return {
      type: AuthType.AccessToken,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: client.id,
        key: client.key,
        displayName: client.displayName.latest,
      },
      user: {
        type: ObjectType.User,
        id: user.id,
        displayName: user.displayName,
      }
    };
  }

  public async authenticateCredentials(credentials: Credentials): Promise<AuthContext> {
    const imClient: InMemoryOauthClient | null = this.oauthProvider._getInMemoryClientByIdOrKey(credentials.login);
    if (imClient === null) {
      throw new Error(`OauthClientNotFound: Client not found for the id or key: ${credentials.login}`);
    }

    const isMatch: boolean = await this.password.verify(imClient.passwordHash.latest, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidSecret");
    }

    return {
      type: AuthType.OauthClient,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: imClient.id,
        key: imClient.key,
        displayName: imClient.displayName.latest,
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
    const user: User | null = await this.user.getUserById(
      {type: AuthType.System, scope: AuthScope.Default},
      userId,
    );
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

  private async getExistingUserById(userId: UserId): Promise<User> {
    const user: User | null = await this.user.getUserById({type: AuthType.System, scope: AuthScope.Default}, userId);

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

  private async createOrUpdateHammerfestUser(hfUserRef: HammerfestUserRef): Promise<void> {
    for (const user of this.hammerfestUsers) {
      if (user.server === hfUserRef.server && user.id === hfUserRef.id) {
        user.username = hfUserRef.login;
        return;
      }
    }
    const hfUser: InMemoryHammerfestUser = {
      server: hfUserRef.server,
      id: hfUserRef.id,
      username: hfUserRef.login,
    };
    this.hammerfestUsers.add(hfUser);
  }

  private async createOrUpdateTwinoidUser(tidUserRef: Partial<TidUser>): Promise<void> {
    for (const user of this.twinoidUsers) {
      if (user.id === tidUserRef.id) {
        user.name = tidUserRef.name!;
        return;
      }
    }
    const tidUser: InMemoryTwinoidUser = {
      id: tidUserRef.id!,
      name: tidUserRef.name!,
    };
    this.twinoidUsers.add(tidUser);
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
