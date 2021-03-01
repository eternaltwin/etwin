import { DeleteDinoparcLinkOptions } from "./delete-dinoparc-link-options.js";
import { DeleteHammerfestLinkOptions } from "./delete-hammerfest-link-options.js";
import { DeleteTwinoidLinkOptions } from "./delete-twinoid-link-options.js";
import { GetLinkFromDinoparcOptions } from "./get-link-from-dinoparc-options.js";
import { GetLinkFromHammerfestOptions } from "./get-link-from-hammerfest-options.js";
import { GetLinkFromTwinoidOptions } from "./get-link-from-twinoid-options.js";
import { GetLinksFromEtwinOptions } from "./get-links-from-etwin-options.js";
import { TouchDinoparcLinkOptions } from "./touch-dinoparc-link-options.js";
import { TouchHammerfestLinkOptions } from "./touch-hammerfest-link-options.js";
import { TouchTwinoidLinkOptions } from "./touch-twinoid-link-options.js";
import { VersionedRawDinoparcLink } from "./versioned-raw-dinoparc-link.js";
import { VersionedRawHammerfestLink } from "./versioned-raw-hammerfest-link.js";
import { VersionedRawLinks } from "./versioned-raw-links";
import { VersionedRawTwinoidLink } from "./versioned-raw-twinoid-link.js";

export interface LinkStore {
  getLinkFromDinoparc(options: Readonly<GetLinkFromDinoparcOptions>): Promise<VersionedRawDinoparcLink>;

  getLinkFromHammerfest(options: Readonly<GetLinkFromHammerfestOptions>): Promise<VersionedRawHammerfestLink>;

  getLinkFromTwinoid(options: Readonly<GetLinkFromTwinoidOptions>): Promise<VersionedRawTwinoidLink>;

  getLinksFromEtwin(options: Readonly<GetLinksFromEtwinOptions>): Promise<VersionedRawLinks>;

  touchDinoparcLink(options: Readonly<TouchDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink>;

  touchHammerfestLink(options: Readonly<TouchHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink>;

  touchTwinoidLink(options: Readonly<TouchTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink>;

  deleteDinoparcLink(options: Readonly<DeleteDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink>;

  deleteHammerfestLink(options: Readonly<DeleteHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink>;

  deleteTwinoidLink(options: Readonly<DeleteTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink>;
}
