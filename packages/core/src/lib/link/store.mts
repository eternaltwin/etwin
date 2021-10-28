import { DeleteDinoparcLinkOptions } from "./delete-dinoparc-link-options.mjs";
import { DeleteHammerfestLinkOptions } from "./delete-hammerfest-link-options.mjs";
import { DeleteTwinoidLinkOptions } from "./delete-twinoid-link-options.mjs";
import { GetLinkFromDinoparcOptions } from "./get-link-from-dinoparc-options.mjs";
import { GetLinkFromHammerfestOptions } from "./get-link-from-hammerfest-options.mjs";
import { GetLinkFromTwinoidOptions } from "./get-link-from-twinoid-options.mjs";
import { GetLinksFromEtwinOptions } from "./get-links-from-etwin-options.mjs";
import { TouchDinoparcLinkOptions } from "./touch-dinoparc-link-options.mjs";
import { TouchHammerfestLinkOptions } from "./touch-hammerfest-link-options.mjs";
import { TouchTwinoidLinkOptions } from "./touch-twinoid-link-options.mjs";
import { VersionedRawDinoparcLink } from "./versioned-raw-dinoparc-link.mjs";
import { VersionedRawHammerfestLink } from "./versioned-raw-hammerfest-link.mjs";
import { VersionedRawLinks } from "./versioned-raw-links.mjs";
import { VersionedRawTwinoidLink } from "./versioned-raw-twinoid-link.mjs";

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
