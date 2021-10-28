import { UuidGenerator } from "../core/uuid-generator.mjs";
import { DinoparcClient } from "../dinoparc/client.mjs";
import { DinoparcCollectionResponse } from "../dinoparc/dinoparc-collection-response.mjs";
import { DinoparcCredentials } from "../dinoparc/dinoparc-credentials.mjs";
import { DinoparcDinozIdRef } from "../dinoparc/dinoparc-dinoz-id-ref.mjs";
import { DinoparcDinozResponse } from "../dinoparc/dinoparc-dinoz-response.mjs";
import { DinoparcInventoryResponse } from "../dinoparc/dinoparc-inventory-response.mjs";
import { DinoparcSession } from "../dinoparc/dinoparc-session.mjs";
import { DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { DinoparcStore } from "../dinoparc/store.mjs";
import { EmailService } from "../email/service.mjs";
import { EmailTemplateService } from "../email-template/service.mjs";
import { HammerfestClient } from "../hammerfest/client.mjs";
import { HammerfestCredentials } from "../hammerfest/hammerfest-credentials.mjs";
import { HammerfestSession } from "../hammerfest/hammerfest-session.mjs";
import { HammerfestStore } from "../hammerfest/store.mjs";
import { LinkService } from "../link/service.mjs";
import { EtwinOauthAccessTokenKey } from "../oauth/etwin-oauth-access-token-key.mjs";
import { GrantOauthAuthorizationOptions } from "../oauth/grant-oauth-authorization-options.mjs";
import { OauthAccessToken } from "../oauth/oauth-access-token.mjs";
import { OauthProviderService } from "../oauth/provider-service.mjs";
import { RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.mjs";
import { PasswordService } from "../password/service.mjs";
import { TwinoidClient } from "../twinoid/client.mjs";
import { TwinoidStore } from "../twinoid/store.mjs";
import { UserStore } from "../user/store.mjs";
import { AuthContext } from "./auth-context.mjs";
import { CreateAccessTokenOptions } from "./create-access-token-options.mjs";
import { Credentials } from "./credentials.mjs";
import { RegisterOrLoginWithEmailOptions } from "./register-or-login-with-email-options.mjs";
import { RegisterWithUsernameOptions } from "./register-with-username-options.mjs";
import { RegisterWithVerifiedEmailOptions } from "./register-with-verified-email-options.mjs";
import { SessionId } from "./session-id.mjs";
import { AuthStore } from "./store.mjs";
import { UserAndSession } from "./user-and-session.mjs";
import { UserCredentials } from "./user-credentials.mjs";

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

  grantOauthAuthorization(acx: AuthContext, options: GrantOauthAuthorizationOptions): Promise<string>;

  createAccessToken(acx: AuthContext, options: CreateAccessTokenOptions): Promise<OauthAccessToken>;

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

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export async function archiveDinoparc(client: DinoparcClient, store: DinoparcStore, dparcSession: DinoparcSession): Promise<void> {
  let dinozList: readonly DinoparcDinozIdRef[];
  try {
    const inv: DinoparcInventoryResponse = await client.getInventory(dparcSession);
    try {
      await store.touchInventory(inv);
    } catch (e) {
      console.error(`touchInventory: ${dparcSession.user.server}/${dparcSession.user.id}`);
      console.error(e);
    }
    const coll: DinoparcCollectionResponse = await client.getCollection(dparcSession);
    try {
      await store.touchCollection(coll);
    } catch (e) {
      console.error(`touchCollection: ${dparcSession.user.server}/${dparcSession.user.id}`);
      console.error(e);
    }
    dinozList = inv.sessionUser.dinoz;
    if (dinozList.length >= 150) {
      const targets: [DinoparcUserId, DinoparcUserId] = await client.getPreferredExchangeWith(dparcSession.user.server);
      const target = targets[0] !== dparcSession.user.id ? targets[0] : targets[1];
      const exchangeWith = await client.getExchangeWith(dparcSession, target);
      try {

        await store.touchExchangeWith(exchangeWith);
      } catch (e) {
        console.error(`touchExchangeWith: ${dparcSession.user.server}/${dparcSession.user.id}`);
        console.error(e);
      }
      dinozList = exchangeWith.ownDinoz;
    }
  } catch (e) {
    console.error(e);
    return;
  }

  for (const dinoz of dinozList) {
    sleep(100);
    try {
      const d: DinoparcDinozResponse = await client.getDinoz(dparcSession, dinoz.id);
      await store.touchDinoz(d);
    } catch (e) {
      console.error(`touchDinoz: ${dparcSession.user.server}/${dparcSession.user.id}/${dinoz.id}`);
      console.error(e);
    }
  }
}

export async function archiveHammerfest(client: HammerfestClient, store: HammerfestStore, hfSession: HammerfestSession): Promise<void> {
  try {
    const res = await client.getOwnItems(hfSession);
    await store.touchInventory(res);
  } catch (e) {
    console.error(`touchInventory: ${hfSession.user.server}/${hfSession.user.id}`);
    console.error(e);
  }
  try {
    const res = await client.getProfileById(hfSession, {server: hfSession.user.server, userId: hfSession.user.id});
    await store.touchProfile(res);
  } catch (e) {
    console.error(`touchProfile: ${hfSession.user.server}/${hfSession.user.id}`);
    console.error(e);
  }
  try {
    const res = await client.getOwnShop(hfSession);
    await store.touchShop(res);
  } catch (e) {
    console.error(`touchShop: ${hfSession.user.server}/${hfSession.user.id}`);
    console.error(e);
  }
  try {
    const res = await client.getOwnGodChildren(hfSession);
    await store.touchGodchildren(res);
  } catch (e) {
    console.error(`touchGodchildren: ${hfSession.user.server}/${hfSession.user.id}`);
    console.error(e);
  }
}
