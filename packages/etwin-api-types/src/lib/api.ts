import { ClientSecret } from "./client-secret";
import { AuthToken } from "./auth-token";
import { UserId } from "./user/user-id";
import { User } from "./user/user";

export interface Api {
  /**
   * Retrieve the user corresponding to the provided user ID.
   *
   * @param clientSecret The client secret key
   * @param authToken User auth token.
   * @param userId ID of the user to retrieve.
   * @returns User data, or `null` if the user is not found.
   */
  getUserById(clientSecret: ClientSecret, authToken: AuthToken, userId: UserId): Promise<User | null>;
}
