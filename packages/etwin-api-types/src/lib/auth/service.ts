import { AuthContext } from "./auth-context";
import { CreateUserOptions } from "./create-user-options";
import { LinkHammerfestUserOptions } from "./link-hammerfest-user-options";
import { LoginWithHammerfestOptions } from "./login-with-hammerfest-options";

export interface Service {
  /**
   * Creates a new user in a pending state.
   *
   * This action creates a new user from an email address, password and optional display name.
   * The user is created in a pending state until it validates its email address.
   * The function returns a token that should be sent by email to the user.
   * User creation is completed with the `completeEmailUserCreation` action.
   *
   * @param authContext Auth context for the user creation, usually a guest context.
   * @param options User creation options.
   */
  registerWithEmail(authContext: AuthContext, options: CreateUserOptions): Promise<void>;

  completeEmailRegistration(authContext: AuthContext, options: CreateUserOptions): Promise<void>;

  /**
   * Authenticate with Hammerfest credentials.
   *
   * Automatically creates a user if the credentials aren't linked to any user yet.
   */
  registerOrLoginWithHammerfest(authContext: AuthContext, options: LoginWithHammerfestOptions): Promise<void>;

  linkHammerfestUser(authContext: AuthContext, options: LinkHammerfestUserOptions): Promise<void>;
}
