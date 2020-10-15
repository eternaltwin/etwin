import { AuthContext } from "../auth/auth-context.js";
import { TwinoidUserId } from "./twinoid-user-id.js";
import { TwinoidUserRef } from "./twinoid-user-ref.js";

export interface TwinoidService {
  /**
   * Retrieves a Twinoid user by id.
   *
   * @param acx Authentification context for this action
   * @param tidId Twinoid id for this user
   * @returns Twinoid profile or null if not found
   */
  getUserById(acx: AuthContext, tidId: TwinoidUserId): Promise<TwinoidUserRef | null>;
}
