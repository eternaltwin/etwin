import { AuthContext } from "../auth/auth-context.js";
import { HammerfestServer } from "./hammerfest-server.js";
import { HammerfestUserId } from "./hammerfest-user-id.js";
import { HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestArchiveService {
  /**
   * Retrieves an Hammerfest user by id.
   *
   * @param acx Authentification context for this action
   * @param hfServer Hammerfest server for this user
   * @param hfId Hammerfest id for this user
   * @returns Hammerfest profile or null if not found
   */
  getUserById(acx: AuthContext, hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null>;

  getUserRefById(acx: AuthContext, hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null>;

  createOrUpdateUserRef(acx: AuthContext, ref: HammerfestUserRef): Promise<HammerfestUserRef>;
}
