import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";

import { LocaleId } from "../core/locale-id.js";
import { ObjectType } from "../core/object-type.js";
import { UuidGenerator } from "../core/uuid-generator.js";
import { DinoparcClient } from "../dinoparc/client.js";
import { DinoparcCredentials } from "../dinoparc/dinoparc-credentials.js";
import { DinoparcSession } from "../dinoparc/dinoparc-session.js";
import { DinoparcStore } from "../dinoparc/store.js";
import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { EmailService } from "../email/service.js";
import { EmailTemplateService } from "../email-template/service.js";
import { HammerfestClient } from "../hammerfest/client.js";
import { HammerfestCredentials } from "../hammerfest/hammerfest-credentials.js";
import { HammerfestSession } from "../hammerfest/hammerfest-session.js";
import { HammerfestStore } from "../hammerfest/store.js";
import { LinkService } from "../link/service.js";
import { VersionedEtwinLink } from "../link/versioned-etwin-link.js";
import { EtwinOauthAccessTokenKey } from "../oauth/etwin-oauth-access-token-key.js";
import { OauthClient } from "../oauth/oauth-client.js";
import { OauthProviderService } from "../oauth/provider-service.js";
import { RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.js";
import { PasswordHash } from "../password/password-hash.js";
import { PasswordService } from "../password/service.js";
import { TwinoidClient } from "../twinoid/client.js";
import { TwinoidStore } from "../twinoid/store.js";
import { TwinoidUser } from "../twinoid/twinoid-user.js";
import { DEFAULT_USER_FIELDS } from "../user/default-user-fields.js";
import { ShortUser } from "../user/short-user.js";
import { SHORT_USER_FIELDS } from "../user/short-user-fields.js";
import { ShortUserWithPassword } from "../user/short-user-with-password.js";
import { SimpleUser } from "../user/simple-user.js";
import { UserStore } from "../user/store.js";
import { UserDisplayName } from "../user/user-display-name.js";
import { UserId } from "../user/user-id.js";
import { UserRef } from "../user/user-ref";
import { $Username, Username } from "../user/username.js";
import { AuthContext } from "./auth-context.js";
import { AuthScope } from "./auth-scope.js";
import { AuthType } from "./auth-type.js";
import { Credentials } from "./credentials.js";
import { $EmailRegistrationJwt, EmailRegistrationJwt } from "./email-registration-jwt.js";
import { GUEST_AUTH } from "./guest-auth-context.js";
import { dinoparcToUserDisplayName, hammerfestToUserDisplayName, readLogin, twinoidToUserDisplayName } from "./helpers.js";
import { Login } from "./login.js";
import { LoginType } from "./login-type.js";
import { RegisterOrLoginWithEmailOptions } from "./register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "./register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "./register-with-verified-email-options.js";
import { Session } from "./session.js";
import { SessionId } from "./session-id.js";
import { AuthStore } from "./store.js";
import { SYSTEM_AUTH } from "./system-auth-context.js";
import { $UserAndSession, UserAndSession } from "./user-and-session.js";
import { UserCredentials } from "./user-credentials.js";
import { $UserLogin } from "./user-login.js";

export interface AuthService {
  /**
   * Authenticates a user using only his email address.
   *
   * If the email address is unknown, sends a registration email to verify the address and complete the registration.
   * If the email address is known, sends a one-time authentication code to the address.
   *
   * @param acx Auth context for the user authentication.
   * @param options Email address, with optional preferred locale for the email content.
   */
  registerOrLoginWithEmail(acx: AuthContext, options: RegisterOrLoginWithEmailOptions): Promise<void>;

  /**
   * Registers a user using an email verification token.
   *
   * @param acx
   * @param options
   * @returns A reference to the newly created user.
   */
  registerWithVerifiedEmail(
    acx: AuthContext,
    options: RegisterWithVerifiedEmailOptions,
  ): Promise<UserAndSession>;

  /**
   * Registers a user using a username and password.
   *
   * @param acx
   * @param options
   * @returns A reference to the newly created user.
   */
  registerWithUsername(
    acx: AuthContext,
    options: RegisterWithUsernameOptions,
  ): Promise<UserAndSession>;

  /**
   * Authenticates a user using a username and password.
   *
   * @param acx
   * @param credentials Email or username, and password.
   * @returns A reference to the newly created user.
   */
  // TODO: Rename to `loginWithUserCredentials`
  loginWithCredentials(
    acx: AuthContext,
    credentials: UserCredentials,
  ): Promise<UserAndSession>;

  /**
   * Authenticates a user using Dinoparc credentials.
   *
   * Automatically creates a user if the credentials aren't linked to any user yet.
   */
  registerOrLoginWithDinoparc(acx: AuthContext, credentials: DinoparcCredentials): Promise<UserAndSession>;

  /**
   * Authenticates a user using Hammerfest credentials.
   *
   * Automatically creates a user if the credentials aren't linked to any user yet.
   */
  registerOrLoginWithHammerfest(acx: AuthContext, credentials: HammerfestCredentials): Promise<UserAndSession>;

  /**
   * Authenticates a user using a Twinoid access token
   *
   * Automatically creates an etwin user if the tid user isn't linked to any user yet.
   */
  registerOrLoginWithTwinoidOauth(acx: AuthContext, accessToken: RfcOauthAccessTokenKey): Promise<UserAndSession>;

  /**
   * Authenticate a user or Oauth client using its credentials (basic oauth scheme)
   */
  authenticateCredentials(
    credentials: Credentials,
  ): Promise<AuthContext>;

  /**
   * Authenticate an access token (e.g. from Oauth)
   */
  authenticateAccessToken(token: EtwinOauthAccessTokenKey): Promise<AuthContext>;

  authenticateSession(acx: AuthContext, sessionId: SessionId): Promise<UserAndSession | null>;
}

export interface DefaultAuthServiceOptions {
  authStore: AuthStore;
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
  twinoidClient: TwinoidClient;
  uuidGenerator: UuidGenerator;
}

export class DefaultAuthService implements AuthService {
  readonly #authStore: AuthStore;
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
  readonly #twinoidClient: TwinoidClient;

  readonly #defaultLocale: LocaleId;

  /**
   * Creates a new authentication service.
   */
  constructor(options: Readonly<DefaultAuthServiceOptions>) {
    this.#authStore = options.authStore;
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

    const oldUser = await this.#userStore.getUser({ref: {email}, fields: SHORT_USER_FIELDS});
    if (oldUser !== null) {
      throw new Error(`Conflict: EmailAddressAlreadyInUse: ${JSON.stringify(oldUser.id)}`);
    }

    const displayName: UserDisplayName = options.displayName;
    const passwordHash: PasswordHash = await this.#password.hash(options.password);
    // TODO: Try/catch check transaction validity: first create the email, then the user, then link (or hardDelete)
    const user: SimpleUser = await this.#userStore.createUser({displayName, email, username: null, password: passwordHash});

    try {
      await this.#authStore.createValidatedEmailVerification(user.id, email, new Date(emailJwt.issuedAt * 1000));
    } catch (err) {
      console.warn(`FailedToCreateEmailVerification\n${err.stack}`);
    }

    const session: Session = await this.#authStore.createSession(user.id);

    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
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
    const user: SimpleUser = await this.#userStore.createUser({displayName, email: null, username, password: passwordHash});
    const session: Session = await this.#authStore.createSession(user.id);
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
  }

  async loginWithCredentials(acx: AuthContext, credentials: UserCredentials): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can log in");
    }
    let ref: UserRef;
    switch ($UserLogin.match(credentials.login)) {
      case $EmailAddress: {
        ref = {email: credentials.login};
        break;
      }
      case $Username: {
        ref = {username: credentials.login};
        break;
      }
      default: {
        throw new Error("AssertionError: Invalid `credentials.login` type");
      }
    }
    const userWithPassword: ShortUserWithPassword | null = await this.#userStore.getUserWithPassword({ref, fields: SHORT_USER_FIELDS, time: undefined});
    if (userWithPassword === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    if (userWithPassword.password === null) {
      throw new Error("NoPassword: Password authentication is not available for this user");
    }

    const isMatch: boolean = await this.#password.verify(userWithPassword.password, credentials.password);

    if (!isMatch) {
      throw new Error("InvalidPassword");
    }

    const session: Session = await this.#authStore.createSession(userWithPassword.id);
    const user = await this.#userStore.getUser({ref: {id: userWithPassword.id}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
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
      const user = await this.#userStore.createUser({displayName, email: null, username: null, password: null});
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
    const session: Session = await this.#authStore.createSession(userId);
    const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
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
      const user = await this.#userStore.createUser({displayName, email: null, username: null, password: null});
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
    const session: Session = await this.#authStore.createSession(userId);
    const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
  }

  async registerOrLoginWithTwinoidOauth(acx: AuthContext, at: RfcOauthAccessTokenKey): Promise<UserAndSession> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can authenticate");
    }
    const tidUser: Pick<TwinoidUser, "id" | "displayName"> = await this.#twinoidClient.getMe(at);
    const link: VersionedEtwinLink = await this.#link.getLinkFromTwinoid(tidUser.id);
    let userId: UserId;
    if (link.current !== null) {
      // TODO: Check that the user is active, otherwise unlink and create a new user
      userId = link.current.user.id;
    } else {
      const displayName = twinoidToUserDisplayName(tidUser);
      const user = await this.#userStore.createUser({displayName, email: null, username: null, password: null});
      try {
        await this.#twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: tidUser.id, displayName: tidUser.displayName});
        await this.#link.linkToTwinoid({
          userId: user.id,
          twinoidUserId: tidUser.id,
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
    const session: Session = await this.#authStore.createSession(userId);
    const user = await this.#userStore.getUser({ref: {id: userId}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }
    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
  }

  async authenticateSession(acx: AuthContext, sessionId: string): Promise<UserAndSession | null> {
    if (acx.type !== AuthType.Guest) {
      throw Error("Forbidden: Only guests can register");
    }
    const session: Session | null = await this.#authStore.getAndTouchSession(sessionId);
    if (session === null) {
      return null;
    }

    const user = await this.#userStore.getUser({ref: {id: session.user.id}, fields: DEFAULT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }

    return $UserAndSession.clone({user, isAdministrator: user.isAdministrator, session});
  }

  public async authenticateAccessToken(token: RfcOauthAccessTokenKey): Promise<AuthContext> {
    const at = await this.#oauthProvider.getAndTouchAccessToken(GUEST_AUTH, token);
    if (at === null) {
      throw new Error("NotFound");
    }

    const client = await this.#oauthProvider.getClientByIdOrKey(GUEST_AUTH, at.client.id);
    if (client === null) {
      throw new Error("AssertionError: ClientNotFound");
    }

    const user = await this.#userStore.getUser({ref: {id: at.user.id}, fields: SHORT_USER_FIELDS});
    if (user === null) {
      throw new Error("AssertionError: UserNotFound");
    }

    // TODO: Add the access time to the auth context?
    return {
      type: AuthType.AccessToken,
      scope: AuthScope.Default,
      client: {
        type: ObjectType.OauthClient,
        id: client.id,
        key: client.key,
        displayName: client.displayName,
      },
      user,
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
}
