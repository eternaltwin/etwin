import { HammerfestServer } from "../hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "../hammerfest/hammerfest-user-id.js";
import { TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { UserId } from "../user/user-id.js";
import { VersionedEtwinLink } from "./versioned-etwin-link";
import { VersionedHammerfestLink } from "./versioned-hammerfest-link.js";
import { VersionedLinks } from "./versioned-links.js";
import { VersionedTwinoidLink } from "./versioned-twinoid-link.js";

export interface LinkService {
  /**
   * Retrieves the links from an eternal-twin user.
   *
   * @param userId Eternal-Twin user id.
   * @returns Links to related users.
   */
  getVersionedLinks(userId: UserId): Promise<VersionedLinks>;

  getLinkFromHammerfest(server: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink>;

  getLinkFromTwinoid(twinoidUserId: TwinoidUserId): Promise<VersionedEtwinLink>;

  linkToHammerfest(userId: UserId, server: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedHammerfestLink>;

  linkToTwinoid(userId: UserId, twinoidUserId: TwinoidUserId): Promise<VersionedTwinoidLink>;
}
