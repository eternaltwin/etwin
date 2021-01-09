import {
  $ArchivedDinoparcUser,
  $NullableArchivedDinoparcUser,
  ArchivedDinoparcUser
} from "@eternal-twin/core/lib/dinoparc/archived-dinoparc-user.js";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "@eternal-twin/core/lib/dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";

declare const MemDinoparcStoreBox: unique symbol;
declare const PgDinoparcStoreBox: unique symbol;
export type NativeDinoparcStoreBox = typeof MemDinoparcStoreBox | typeof PgDinoparcStoreBox;

export abstract class NativeDinoparcStore implements DinoparcStore {
  public readonly box: NativeDinoparcStoreBox;
  private static GET_SHORT_USER = promisify(native.dinoparcStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.dinoparcStore.touchShortUser);

  constructor(box: NativeDinoparcStoreBox) {
    this.box = box;
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ArchivedDinoparcUser | null> {
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableArchivedDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser> {
    const rawShort: string = $ShortDinoparcUser.write(JSON_WRITER, short);
    const rawOut = await NativeDinoparcStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedDinoparcUser.read(JSON_READER, rawOut);
  }
}

export interface MemDinoparcStoreOptions {
  clock: NativeClock;
}

export class MemDinoparcStore extends NativeDinoparcStore {
  constructor(options: Readonly<MemDinoparcStoreOptions>) {
    super(native.dinoparcStore.mem.new(options.clock.box));
  }
}

export interface PgDinoparcStoreOptions {
  clock: NativeClock;
  database: Database;
}

export class PgDinoparcStore extends NativeDinoparcStore {
  constructor(options: Readonly<PgDinoparcStoreOptions>) {
    super(native.dinoparcStore.pg.new(options.clock.box, options.database.box));
  }
}
