import { AuthContext } from "../auth/auth-context.js";
import { CompleteUser } from "./complete-user.js";
import { ShortUser } from "./short-user.js";
import { UserId } from "./user-id.js";
import { User } from "./user.js";

export interface SimpleUserService {
  /**
   * Retrieve the user corresponding to the provided user ID.
   *
   * @param acx The client secret key
   * @param id ID of the user to retrieve.
   * @returns User data, or `null` if the user is not found.
   */
  getUserById(acx: AuthContext, id: UserId): Promise<User | CompleteUser | null>;

  getShortUserById(acx: AuthContext, id: UserId): Promise<ShortUser | null>;
}
