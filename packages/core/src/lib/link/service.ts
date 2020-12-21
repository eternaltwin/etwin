import { DinoparcServer } from "../dinoparc/dinoparc-server.js";
import { DinoparcUserId } from "../dinoparc/dinoparc-user-id.js";
import { HammerfestServer } from "../hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "../hammerfest/hammerfest-user-id.js";
import { TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { UserId } from "../user/user-id.js";
import { SimpleLinkToDinoparcOptions } from "./simple-link-to-dinoparc-options.js";
import { SimpleLinkToHammerfestOptions } from "./simple-link-to-hammerfest-options.js";
import { SimpleLinkToTwinoidOptions } from "./simple-link-to-twinoid-options.js";
import { VersionedDinoparcLink } from "./versioned-dinoparc-link.js";
import { VersionedEtwinLink } from "./versioned-etwin-link.js";
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

  getLinkFromDinoparc(server: DinoparcServer, dparcUserId: DinoparcUserId): Promise<VersionedEtwinLink>;

  getLinkFromHammerfest(server: HammerfestServer, hfUserId: HammerfestUserId): Promise<VersionedEtwinLink>;

  getLinkFromTwinoid(twinoidUserId: TwinoidUserId): Promise<VersionedEtwinLink>;

  linkToDinoparc(options: Readonly<SimpleLinkToDinoparcOptions>): Promise<VersionedDinoparcLink>;

  linkToHammerfest(options: Readonly<SimpleLinkToHammerfestOptions>): Promise<VersionedHammerfestLink>;

  linkToTwinoid(options: Readonly<SimpleLinkToTwinoidOptions>): Promise<VersionedTwinoidLink>;
}
