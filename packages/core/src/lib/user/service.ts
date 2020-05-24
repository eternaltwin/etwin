import { AuthContext } from "../auth/auth-context.js";
import { CompleteUser } from "./complete-user.js";
import { UserId } from "./user-id.js";
import { UserRef } from "./user-ref.js";
import { User } from "./user.js";

export interface UserService {
  /**
   * Retrieve the user corresponding to the provided user ID.
   *
   * @param clientSecret The client secret key
   * @param authToken User auth token.
   * @param userId ID of the user to retrieve.
   * @returns User data, or `null` if the user is not found.
   */
  getUserById(authContext: AuthContext, id: UserId): Promise<User | CompleteUser | null>;

  getUserRefById(authContext: AuthContext, id: UserId): Promise<UserRef | null>;
}
