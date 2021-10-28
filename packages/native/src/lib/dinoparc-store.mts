import {
  $ArchivedDinoparcUser,
  $NullableArchivedDinoparcUser,
  ArchivedDinoparcUser
} from "@eternal-twin/core/dinoparc/archived-dinoparc-user";
import {
  $DinoparcCollectionResponse,
  DinoparcCollectionResponse
} from "@eternal-twin/core/dinoparc/dinoparc-collection-response";
import { $DinoparcDinozResponse, DinoparcDinozResponse } from "@eternal-twin/core/dinoparc/dinoparc-dinoz-response";
import {
  $DinoparcExchangeWithResponse,
  DinoparcExchangeWithResponse
} from "@eternal-twin/core/dinoparc/dinoparc-exchange-with-response";
import {
  $DinoparcInventoryResponse,
  DinoparcInventoryResponse
} from "@eternal-twin/core/dinoparc/dinoparc-inventory-response";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/dinoparc/get-dinoparc-user-options";
import { $ShortDinoparcUser, ShortDinoparcUser } from "@eternal-twin/core/dinoparc/short-dinoparc-user";
import { DinoparcStore } from "@eternal-twin/core/dinoparc/store";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";
import { Database } from "./database.mjs";
import { NativeUuidGenerator } from "./uuid.mjs";

declare const MemDinoparcStoreBox: unique symbol;
declare const PgDinoparcStoreBox: unique symbol;
export type NativeDinoparcStoreBox = typeof MemDinoparcStoreBox | typeof PgDinoparcStoreBox;

export abstract class NativeDinoparcStore implements DinoparcStore {
  public readonly box: NativeDinoparcStoreBox;
  private static GET_USER = promisify(native.dinoparcStore.getUser);
  private static TOUCH_SHORT_USER = promisify(native.dinoparcStore.touchShortUser);
  private static TOUCH_DINOZ = promisify(native.dinoparcStore.touchDinoz);
  private static TOUCH_INVENTORY = promisify(native.dinoparcStore.touchInventory);
  private static TOUCH_COLLECTION = promisify(native.dinoparcStore.touchCollection);
  private static TOUCH_EXCHANGE_WITH = promisify(native.dinoparcStore.touchExchangeWith);

  constructor(box: NativeDinoparcStoreBox) {
    this.box = box;
  }

  async getUser(options: Readonly<GetDinoparcUserOptions>): Promise<ArchivedDinoparcUser | null> {
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcStore.GET_USER(this.box, rawOptions);
    return $NullableArchivedDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser> {
    const rawShort: string = $ShortDinoparcUser.write(JSON_WRITER, short);
    const rawOut = await NativeDinoparcStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchInventory(response: Readonly<DinoparcInventoryResponse>): Promise<void> {
    const rawShort: string = $DinoparcInventoryResponse.write(JSON_WRITER, response);
    await NativeDinoparcStore.TOUCH_INVENTORY(this.box, rawShort);
  }

  async touchCollection(response: Readonly<DinoparcCollectionResponse>): Promise<void> {
    const rawShort: string = $DinoparcCollectionResponse.write(JSON_WRITER, response);
    await NativeDinoparcStore.TOUCH_COLLECTION(this.box, rawShort);
  }

  async touchDinoz(response: Readonly<DinoparcDinozResponse>): Promise<void> {
    const rawShort: string = $DinoparcDinozResponse.write(JSON_WRITER, response);
    await NativeDinoparcStore.TOUCH_DINOZ(this.box, rawShort);
  }

  async touchExchangeWith(response: Readonly<DinoparcExchangeWithResponse>): Promise<void> {
    const rawShort: string = $DinoparcExchangeWithResponse.write(JSON_WRITER, response);
    await NativeDinoparcStore.TOUCH_EXCHANGE_WITH(this.box, rawShort);
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
  uuidGenerator: NativeUuidGenerator;
}

export class PgDinoparcStore extends NativeDinoparcStore {
  private static NEW = promisify(native.dinoparcStore.pg.new);

  private constructor(box: typeof PgDinoparcStoreBox) {
    super(box);
  }

  public static async create(options: Readonly<PgDinoparcStoreOptions>): Promise<PgDinoparcStore> {
    const box = await PgDinoparcStore.NEW(options.clock.box, options.database.box, options.uuidGenerator.box);
    return new PgDinoparcStore(box);
  }
}
