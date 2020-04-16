import { AuthContext } from "./auth-context.js";
import { Credentials } from "./credentials.js";
import { LinkHammerfestUserOptions } from "./link-hammerfest-user-options.js";
import { LoginWithHammerfestOptions } from "./login-with-hammerfest-options.js";
import { RegisterOrLoginWithEmailOptions } from "./register-or-login-with-email-options.js";
import { RegisterWithUsernameOptions } from "./register-with-username-options";
import { RegisterWithVerifiedEmailOptions } from "./register-with-verified-email-options.js";
import { SessionId } from "./session-id";
import { UserAndSession } from "./user-and-session";

export interface AuthService {
  /**
   * Authenticates a user using only his email address.
   *
   * If the email address is unknown, sends a registration email to verify the address and complete the registration.
   * If the email address is known, sends a one-time authentication code to the address.
   *
   * @param authContext Auth context for the user authentication.
   * @param options Email address, with optional preferred locale for the email content.
   */
  registerOrLoginWithEmail(authContext: AuthContext, options: RegisterOrLoginWithEmailOptions): Promise<void>;

  /**
   * Registers a user using an email verification token.
   *
   * @param authContext
   * @param options
   * @returns A reference to the newly created user.
   */
  registerWithVerifiedEmail(
    authContext: AuthContext,
    options: RegisterWithVerifiedEmailOptions,
  ): Promise<UserAndSession>;

  /**
   * Registers a user using a username and password.
   *
   * @param authContext
   * @param options
   * @returns A reference to the newly created user.
   */
  registerWithUsername(
    authContext: AuthContext,
    options: RegisterWithUsernameOptions,
  ): Promise<UserAndSession>;

  /**
   * Registers a user using a username and password.
   *
   * @param authContext
   * @param credentials Email or username, and password.
   * @returns A reference to the newly created user.
   */
  loginWithCredentials(
    authContext: AuthContext,
    credentials: Credentials,
  ): Promise<UserAndSession>;

  /**
   * Authenticate with Hammerfest credentials.
   *
   * Automatically creates a user if the credentials aren't linked to any user yet.
   */
  registerOrLoginWithHammerfest(authContext: AuthContext, options: LoginWithHammerfestOptions): Promise<void>;

  linkHammerfestUser(authContext: AuthContext, options: LinkHammerfestUserOptions): Promise<void>;

  authenticateSession(authContext: AuthContext, sessionId: SessionId): Promise<UserAndSession | null>;
}
