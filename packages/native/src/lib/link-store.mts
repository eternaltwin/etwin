import {
  $DeleteDinoparcLinkOptions,
  DeleteDinoparcLinkOptions
} from "@eternal-twin/core/link/delete-dinoparc-link-options";
import {
  $DeleteHammerfestLinkOptions,
  DeleteHammerfestLinkOptions
} from "@eternal-twin/core/link/delete-hammerfest-link-options";
import {
  $DeleteTwinoidLinkOptions,
  DeleteTwinoidLinkOptions
} from "@eternal-twin/core/link/delete-twinoid-link-options";
import {
  $GetLinkFromDinoparcOptions,
  GetLinkFromDinoparcOptions
} from "@eternal-twin/core/link/get-link-from-dinoparc-options";
import {
  $GetLinkFromHammerfestOptions,
  GetLinkFromHammerfestOptions
} from "@eternal-twin/core/link/get-link-from-hammerfest-options";
import {
  $GetLinkFromTwinoidOptions,
  GetLinkFromTwinoidOptions
} from "@eternal-twin/core/link/get-link-from-twinoid-options";
import {
  $GetLinksFromEtwinOptions,
  GetLinksFromEtwinOptions
} from "@eternal-twin/core/link/get-links-from-etwin-options";
import { LinkStore } from "@eternal-twin/core/link/store";
import {
  $TouchDinoparcLinkOptions,
  TouchDinoparcLinkOptions
} from "@eternal-twin/core/link/touch-dinoparc-link-options";
import {
  $TouchHammerfestLinkOptions,
  TouchHammerfestLinkOptions
} from "@eternal-twin/core/link/touch-hammerfest-link-options";
import {
  $TouchTwinoidLinkOptions,
  TouchTwinoidLinkOptions
} from "@eternal-twin/core/link/touch-twinoid-link-options";
import {
  $VersionedRawDinoparcLink,
  VersionedRawDinoparcLink
} from "@eternal-twin/core/link/versioned-raw-dinoparc-link";
import {
  $VersionedRawHammerfestLink,
  VersionedRawHammerfestLink
} from "@eternal-twin/core/link/versioned-raw-hammerfest-link";
import { $VersionedRawLinks, VersionedRawLinks } from "@eternal-twin/core/link/versioned-raw-links";
import {
  $VersionedRawTwinoidLink,
  VersionedRawTwinoidLink
} from "@eternal-twin/core/link/versioned-raw-twinoid-link";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";
import { Database } from "./database.mjs";

declare const MemLinkStoreBox: unique symbol;
declare const PgLinkStoreBox: unique symbol;
export type NativeLinkStoreBox = typeof MemLinkStoreBox | typeof PgLinkStoreBox;

export abstract class NativeLinkStore implements LinkStore {
  public readonly box: NativeLinkStoreBox;
  private static GET_LINK_FROM_DINOPARC = promisify(native.linkStore.getLinkFromDinoparc);
  private static GET_LINK_FROM_HAMMERFEST = promisify(native.linkStore.getLinkFromHammerfest);
  private static GET_LINK_FROM_TWINOID = promisify(native.linkStore.getLinkFromTwinoid);
  private static GET_LINKS_FROM_ETWIN = promisify(native.linkStore.getLinksFromEtwin);
  private static TOUCH_DINOPARC_LINK = promisify(native.linkStore.touchDinoparcLink);
  private static TOUCH_HAMMERFEST_LINK = promisify(native.linkStore.touchHammerfestLink);
  private static TOUCH_TWINOID_LINK = promisify(native.linkStore.touchTwinoidLink);
  private static DELETE_DINOPARC_LINK = promisify(native.linkStore.deleteDinoparcLink);
  private static DELETE_HAMMERFEST_LINK = promisify(native.linkStore.deleteHammerfestLink);
  private static DELETE_TWINOID_LINK = promisify(native.linkStore.deleteTwinoidLink);

  constructor(box: NativeLinkStoreBox) {
    this.box = box;
  }

  async getLinkFromDinoparc(options: Readonly<GetLinkFromDinoparcOptions>): Promise<VersionedRawDinoparcLink> {
    const rawOptions: string = $GetLinkFromDinoparcOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.GET_LINK_FROM_DINOPARC(this.box, rawOptions);
    return $VersionedRawDinoparcLink.read(JSON_READER, rawOut);
  }

  async getLinkFromHammerfest(options: Readonly<GetLinkFromHammerfestOptions>): Promise<VersionedRawHammerfestLink> {
    const rawOptions: string = $GetLinkFromHammerfestOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.GET_LINK_FROM_HAMMERFEST(this.box, rawOptions);
    return $VersionedRawHammerfestLink.read(JSON_READER, rawOut);
  }

  async getLinkFromTwinoid(options: Readonly<GetLinkFromTwinoidOptions>): Promise<VersionedRawTwinoidLink> {
    const rawOptions: string = $GetLinkFromTwinoidOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.GET_LINK_FROM_TWINOID(this.box, rawOptions);
    return $VersionedRawTwinoidLink.read(JSON_READER, rawOut);
  }

  async getLinksFromEtwin(options: Readonly<GetLinksFromEtwinOptions>): Promise<VersionedRawLinks> {
    const rawOptions: string = $GetLinksFromEtwinOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.GET_LINKS_FROM_ETWIN(this.box, rawOptions);
    return $VersionedRawLinks.read(JSON_READER, rawOut);
  }

  async touchDinoparcLink(options: Readonly<TouchDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink> {
    const rawOptions: string = $TouchDinoparcLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.TOUCH_DINOPARC_LINK(this.box, rawOptions);
    return $VersionedRawDinoparcLink.read(JSON_READER, rawOut);
  }

  async touchHammerfestLink(options: Readonly<TouchHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink> {
    const rawOptions: string = $TouchHammerfestLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.TOUCH_HAMMERFEST_LINK(this.box, rawOptions);
    return $VersionedRawHammerfestLink.read(JSON_READER, rawOut);
  }

  async touchTwinoidLink(options: Readonly<TouchTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink> {
    const rawOptions: string = $TouchTwinoidLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.TOUCH_TWINOID_LINK(this.box, rawOptions);
    return $VersionedRawTwinoidLink.read(JSON_READER, rawOut);
  }

  async deleteDinoparcLink(options: Readonly<DeleteDinoparcLinkOptions>): Promise<VersionedRawDinoparcLink> {
    const rawOptions: string = $DeleteDinoparcLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.DELETE_DINOPARC_LINK(this.box, rawOptions);
    return $VersionedRawDinoparcLink.read(JSON_READER, rawOut);
  }

  async deleteHammerfestLink(options: Readonly<DeleteHammerfestLinkOptions>): Promise<VersionedRawHammerfestLink> {
    const rawOptions: string = $DeleteHammerfestLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.DELETE_HAMMERFEST_LINK(this.box, rawOptions);
    return $VersionedRawHammerfestLink.read(JSON_READER, rawOut);
  }

  async deleteTwinoidLink(options: Readonly<DeleteTwinoidLinkOptions>): Promise<VersionedRawTwinoidLink> {
    const rawOptions: string = $DeleteTwinoidLinkOptions.write(JSON_WRITER, options);
    const rawOut = await NativeLinkStore.DELETE_TWINOID_LINK(this.box, rawOptions);
    return $VersionedRawTwinoidLink.read(JSON_READER, rawOut);
  }
}

export interface MemLinkStoreOptions {
  clock: NativeClock;
}

export class MemLinkStore extends NativeLinkStore {
  constructor(options: Readonly<MemLinkStoreOptions>) {
    super(native.linkStore.mem.new(options.clock.box));
  }
}

export interface PgLinkStoreOptions {
  clock: NativeClock;
  database: Database;
}

export class PgLinkStore extends NativeLinkStore {
  constructor(options: Readonly<PgLinkStoreOptions>) {
    super(native.linkStore.pg.new(options.clock.box, options.database.box));
  }
}
