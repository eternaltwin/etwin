import { AuthContext } from "../auth/auth-context";
import { HammerfestServer } from "./hammerfest-server";
import { HammerfestUserId } from "./hammerfest-user-id";
import { HammerfestUserRef } from "./hammerfest-user-ref";

export interface HammerfestService {
  /**
   * Tests if a session key is still valid.
   *
   * @param acx Authentification context for this action
   * @param hfServer Hammerfest server for this user
   * @param hfId Hammerfest id for this user
   * @returns Hammerfest profile or null if not found
   */
  getUserById(acx: AuthContext, hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null>;
}
