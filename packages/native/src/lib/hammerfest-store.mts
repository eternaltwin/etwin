import {
  $ArchivedHammerfestUser,
  $NullableArchivedHammerfestUser,
  ArchivedHammerfestUser
} from "@eternal-twin/core/hammerfest/archived-hammerfest-user";
import {
  $GetHammerfestUserOptions,
  GetHammerfestUserOptions
} from "@eternal-twin/core/hammerfest/get-hammerfest-user-options";
import {
  $HammerfestForumThemePageResponse,
  HammerfestForumThemePageResponse
} from "@eternal-twin/core/hammerfest/hammerfest-forum-theme-page-response";
import {
  $HammerfestForumThreadPageResponse,
  HammerfestForumThreadPageResponse
} from "@eternal-twin/core/hammerfest/hammerfest-forum-thread-page-response";
import {
  $HammerfestGodchildrenResponse,
  HammerfestGodchildrenResponse
} from "@eternal-twin/core/hammerfest/hammerfest-godchildren-response";
import {
  $HammerfestInventoryResponse,
  HammerfestInventoryResponse
} from "@eternal-twin/core/hammerfest/hammerfest-inventory-response";
import {
  $HammerfestProfileResponse,
  HammerfestProfileResponse
} from "@eternal-twin/core/hammerfest/hammerfest-profile-response";
import {
  $HammerfestShopResponse,
  HammerfestShopResponse
} from "@eternal-twin/core/hammerfest/hammerfest-shop-response";
import {
  $NullableShortHammerfestUser,
  $ShortHammerfestUser,
  ShortHammerfestUser
} from "@eternal-twin/core/hammerfest/short-hammerfest-user";
import { HammerfestStore } from "@eternal-twin/core/hammerfest/store";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";
import { Database } from "./database.mjs";
import { NativeUuidGenerator } from "./uuid.mjs";

declare const MemHammerfestStoreBox: unique symbol;
declare const PgHammerfestStoreBox: unique symbol;
export type NativeHammerfestStoreBox = typeof MemHammerfestStoreBox | typeof PgHammerfestStoreBox;

export abstract class NativeHammerfestStore implements HammerfestStore {
  public readonly box: NativeHammerfestStoreBox;
  private static GET_USER = promisify(native.hammerfestStore.getUser);
  private static GET_SHORT_USER = promisify(native.hammerfestStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.hammerfestStore.touchShortUser);
  private static TOUCH_SHOP = promisify(native.hammerfestStore.touchShop);
  private static TOUCH_PROFILE = promisify(native.hammerfestStore.touchProfile);
  private static TOUCH_INVENTORY = promisify(native.hammerfestStore.touchInventory);
  private static TOUCH_GODCHILDREN = promisify(native.hammerfestStore.touchGodchildren);
  private static TOUCH_THEME_PAGE = promisify(native.hammerfestStore.touchThemePage);
  private static TOUCH_THREAD_PAGE = promisify(native.hammerfestStore.touchThreadPage);

  constructor(box: NativeHammerfestStoreBox) {
    this.box = box;
  }

  async getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    const rawOptions: string = $GetHammerfestUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestStore.GET_USER(this.box, rawOptions);
    return $NullableArchivedHammerfestUser.read(JSON_READER, rawOut);
  }

  async getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null> {
    const rawOptions: string = $GetHammerfestUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableShortHammerfestUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser> {
    const rawShort: string = $ShortHammerfestUser.write(JSON_WRITER, short);
    const rawOut = await NativeHammerfestStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedHammerfestUser.read(JSON_READER, rawOut);
  }

  async touchShop(res: Readonly<HammerfestShopResponse>): Promise<void> {
    const rawRes: string = $HammerfestShopResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_SHOP(this.box, rawRes);
  }

  async touchProfile(res: Readonly<HammerfestProfileResponse>): Promise<void> {
    const rawRes: string = $HammerfestProfileResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_PROFILE(this.box, rawRes);
  }

  async touchInventory(res: Readonly<HammerfestInventoryResponse>): Promise<void> {
    const rawRes: string = $HammerfestInventoryResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_INVENTORY(this.box, rawRes);
  }

  async touchGodchildren(res: Readonly<HammerfestGodchildrenResponse>): Promise<void> {
    const rawRes: string = $HammerfestGodchildrenResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_GODCHILDREN(this.box, rawRes);
  }

  async touchThemePage(res: Readonly<HammerfestForumThemePageResponse>): Promise<void> {
    const rawRes: string = $HammerfestForumThemePageResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_THEME_PAGE(this.box, rawRes);
  }

  async touchThreadPage(res: Readonly<HammerfestForumThreadPageResponse>): Promise<void> {
    const rawRes: string = $HammerfestForumThreadPageResponse.write(JSON_WRITER, res);
    await NativeHammerfestStore.TOUCH_THREAD_PAGE(this.box, rawRes);
  }
}

export interface MemHammerfestStoreOptions {
  clock: NativeClock;
}

export class MemHammerfestStore extends NativeHammerfestStore {
  constructor(options: Readonly<MemHammerfestStoreOptions>) {
    super(native.hammerfestStore.mem.new(options.clock.box));
  }
}

export interface PgHammerfestStoreOptions {
  clock: NativeClock;
  database: Database;
  databaseSecret: string;
  uuidGenerator: NativeUuidGenerator;
}

export class PgHammerfestStore extends NativeHammerfestStore {
  private static NEW = promisify(native.hammerfestStore.pg.new);

  private constructor(box: typeof PgHammerfestStoreBox) {
    super(box);
  }

  public static async create(options: Readonly<PgHammerfestStoreOptions>): Promise<PgHammerfestStore> {
    const box = await PgHammerfestStore.NEW(options.clock.box, options.database.box, options.databaseSecret, options.uuidGenerator.box);
    return new PgHammerfestStore(box);
  }
}
