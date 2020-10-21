import { TwinoidUserId } from "./twinoid-user-id.js";
import { TwinoidUserRef } from "./twinoid-user-ref.js";

export interface TwinoidArchiveService {
  /**
   * Retrieves a Twinoid user by id.
   *
   * @param tidId Twinoid id for this user
   * @returns Twinoid profile or null if not found
   */
  getUserById(tidId: TwinoidUserId): Promise<TwinoidUserRef | null>;

  getUserRefById(tidId: TwinoidUserId): Promise<TwinoidUserRef | null>;

  createOrUpdateUserRef(ref: TwinoidUserRef): Promise<TwinoidUserRef>;
}
