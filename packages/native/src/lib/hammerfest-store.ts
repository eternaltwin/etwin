import {
  $ArchivedHammerfestUser,
  $NullableArchivedHammerfestUser,
  ArchivedHammerfestUser
} from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user.js";
import {
  $GetHammerfestUserOptions,
  GetHammerfestUserOptions
} from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options.js";
import {
  $NullableShortHammerfestUser,
  $ShortHammerfestUser,
  ShortHammerfestUser
} from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";

declare const MemHammerfestStoreBox: unique symbol;
declare const PgHammerfestStoreBox: unique symbol;
export type NativeHammerfestStoreBox = typeof MemHammerfestStoreBox | typeof PgHammerfestStoreBox;

export abstract class NativeHammerfestStore implements HammerfestStore {
  public readonly box: NativeHammerfestStoreBox;
  private static GET_USER = promisify(native.hammerfestStore.getUser);
  private static GET_SHORT_USER = promisify(native.hammerfestStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.hammerfestStore.touchShortUser);

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
}

export class PgHammerfestStore extends NativeHammerfestStore {
  constructor(options: Readonly<PgHammerfestStoreOptions>) {
    super(native.hammerfestStore.pg.new(options.clock.box, options.database.box));
  }
}
