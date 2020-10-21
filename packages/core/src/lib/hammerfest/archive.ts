import { HammerfestServer } from "./hammerfest-server.js";
import { HammerfestUserId } from "./hammerfest-user-id.js";
import { HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestArchiveService {
  /**
   * Retrieves an Hammerfest user by id.
   *
   * @param hfServer Hammerfest server for this user
   * @param hfId Hammerfest id for this user
   * @returns Hammerfest profile or null if not found
   */
  getUserById(hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null>;

  getUserRefById(hfServer: HammerfestServer, hfId: HammerfestUserId): Promise<HammerfestUserRef | null>;

  createOrUpdateUserRef(ref: HammerfestUserRef): Promise<HammerfestUserRef>;
}
