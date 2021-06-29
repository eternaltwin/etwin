import {
  $ArchivedHammerfestUser,
  $NullableArchivedHammerfestUser,
  ArchivedHammerfestUser
} from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user";
import {
  $GetHammerfestUserOptions,
  GetHammerfestUserOptions
} from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options";
import {
  $NullableShortHammerfestUser,
  $ShortHammerfestUser,
  ShortHammerfestUser
} from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import { JSON_READER } from "kryo-json/lib/json-reader";
import { JSON_WRITER } from "kryo-json/lib/json-writer";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";
import { NativeUuidGenerator } from "./uuid";

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
