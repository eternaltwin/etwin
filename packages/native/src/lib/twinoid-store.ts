import {
  $ArchivedTwinoidUser,
  $NullableArchivedTwinoidUser,
  ArchivedTwinoidUser
} from "@eternal-twin/core/lib/twinoid/archived-twinoid-user.js";
import {
  $GetTwinoidUserOptions,
  GetTwinoidUserOptions
} from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options.js";
import {
  $NullableShortTwinoidUser,
  $ShortTwinoidUser,
  ShortTwinoidUser
} from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { JSON_READER } from "kryo-json/lib/json-reader";
import { JSON_WRITER } from "kryo-json/lib/json-writer";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";

declare const MemTwinoidStoreBox: unique symbol;
declare const PgTwinoidStoreBox: unique symbol;
export type NativeTwinoidStoreBox = typeof MemTwinoidStoreBox | typeof PgTwinoidStoreBox;

export abstract class NativeTwinoidStore implements TwinoidStore {
  public readonly box: NativeTwinoidStoreBox;
  private static GET_USER = promisify(native.twinoidStore.getUser);
  private static GET_SHORT_USER = promisify(native.twinoidStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.twinoidStore.touchShortUser);

  constructor(box: NativeTwinoidStoreBox) {
    this.box = box;
  }

  async getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null> {
    const rawOptions: string = $GetTwinoidUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeTwinoidStore.GET_USER(this.box, rawOptions);
    return $NullableArchivedTwinoidUser.read(JSON_READER, rawOut);
  }

  async getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    const rawOptions: string = $GetTwinoidUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeTwinoidStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableShortTwinoidUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ArchivedTwinoidUser> {
    const rawShort: string = $ShortTwinoidUser.write(JSON_WRITER, short);
    const rawOut = await NativeTwinoidStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedTwinoidUser.read(JSON_READER, rawOut);
  }
}

export interface MemTwinoidStoreOptions {
  clock: NativeClock;
}

export class MemTwinoidStore extends NativeTwinoidStore {
  constructor(options: Readonly<MemTwinoidStoreOptions>) {
    super(native.twinoidStore.mem.new(options.clock.box));
  }
}

export interface PgTwinoidStoreOptions {
  clock: NativeClock;
  database: Database;
}

export class PgTwinoidStore extends NativeTwinoidStore {
  constructor(options: Readonly<PgTwinoidStoreOptions>) {
    super(native.twinoidStore.pg.new(options.clock.box, options.database.box));
  }
}
