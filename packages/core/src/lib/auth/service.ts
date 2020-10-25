import { HammerfestCredentials } from "../hammerfest/hammerfest-credentials.js";
import { OauthAccessTokenKey } from "../oauth/oauth-access-token-key.js";
import { UserId } from "../user/user-id.js";
import { AuthContext } from "./auth-context.js";
import { Credentials } from "./credentials.js";
import { RegisterOrLoginWithEmailOptions } from "./register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "./register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "./register-with-verified-email-options.js";
import { SessionId } from "./session-id.js";
import { UserAndSession } from "./user-and-session.js";

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
  loginWithCredentials(
    acx: AuthContext,
    credentials: Credentials,
  ): Promise<UserAndSession>;

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
  registerOrLoginWithTwinoidOauth(acx: AuthContext, accessToken: OauthAccessTokenKey): Promise<UserAndSession>;

  /**
   * Authenticate an Oauth client using its credentials
   *
   * TODO: Merge `loginWithCredentials` into this function.
   */
  authenticateCredentials(
    credentials: Credentials,
  ): Promise<AuthContext>;

  /**
   * Authenticate an access token (e.g. from Oauth)
   */
  authenticateAccessToken(
    token: OauthAccessTokenKey,
  ): Promise<AuthContext>;

  authenticateSession(acx: AuthContext, sessionId: SessionId): Promise<UserAndSession | null>;

  hasPassword(userId: UserId): Promise<boolean>;
}
