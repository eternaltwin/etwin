import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import {
  $ArchivedDinoparcUser,
  $NullableArchivedDinoparcUser,
  ArchivedDinoparcUser
} from "@eternal-twin/core/lib/dinoparc/archived-dinoparc-user.js";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import {
  $ShortDinoparcUser,
  ShortDinoparcUser
} from "@eternal-twin/core/lib/dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import { UuidHex } from "kryo/lib/uuid-hex.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";

declare const SystemClockBox: unique symbol;

export class SystemClock implements ClockService {
  public readonly box: typeof SystemClockBox;

  constructor() {
    this.box = native.clock.systemClock.new();
  }

  now(): Date {
    return native.clock.now(this.box);
  }

  nowUnixS(): number {
    return native.clock.nowUnixS(this.box);
  }

  nowUnixMs(): number {
    return native.clock.nowUnixMs(this.box);
  }
}

declare const VirtualClockBox: unique symbol;

export class VirtualClock implements ClockService {
  public readonly box: typeof VirtualClockBox;

  constructor() {
    this.box = native.clock.virtualClock.new();
  }

  now(): Date {
    return native.clock.now(this.box);
  }

  nowUnixS(): number {
    return native.clock.nowUnixS(this.box);
  }

  nowUnixMs(): number {
    return native.clock.nowUnixMs(this.box);
  }
}

export type NativeClock = SystemClock | VirtualClock;

declare const Uuid4GeneratorBox: unique symbol;

export class Uuid4Generator implements UuidGenerator {
  public readonly box: typeof Uuid4GeneratorBox;

  constructor() {
    this.box = native.uuid.uuid4Generator.new();
  }

  next(): UuidHex {
    return native.uuid.uuid4Generator.next(this.box);
  }
}

export interface MemDinoparcStoreOptions {
  clock: NativeClock;
}

declare const MemDinoparcStoreBox: unique symbol;

export class MemDinoparcStore implements DinoparcStore {
  public readonly box: typeof MemDinoparcStoreBox;
  private static GET_SHORT_USER = promisify(native.dinoparcStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.dinoparcStore.touchShortUser);

  constructor(options: Readonly<MemDinoparcStoreOptions>) {
    this.box = native.dinoparcStore.mem.new(options.clock.box);
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ArchivedDinoparcUser | null> {
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await MemDinoparcStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableArchivedDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser> {
    const rawShort: string = $ShortDinoparcUser.write(JSON_WRITER, short);
    const rawOut = await MemDinoparcStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedDinoparcUser.read(JSON_READER, rawOut);
  }
}

export interface PgDinoparcStoreOptions {
  clock: NativeClock;
  database: Database;
}

declare const PgDinoparcStoreBox: unique symbol;

export class PgDinoparcStore implements DinoparcStore {
  public readonly box: typeof PgDinoparcStoreBox;
  private static GET_SHORT_USER = promisify(native.dinoparcStore.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.dinoparcStore.touchShortUser);

  constructor(options: Readonly<PgDinoparcStoreOptions>) {
    this.box = native.dinoparcStore.pg.new(options.clock.box, options.database.box);
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ArchivedDinoparcUser | null> {
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await PgDinoparcStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableArchivedDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ArchivedDinoparcUser> {
    const rawShort: string = $ShortDinoparcUser.write(JSON_WRITER, short);
    const rawOut = await PgDinoparcStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ArchivedDinoparcUser.read(JSON_READER, rawOut);
  }
}

export interface DatabaseOptions {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

declare const DatabaseBox: unique symbol;

export class Database {
  public readonly box: typeof DatabaseBox;
  private static NEW = promisify(native.database.new);

  private constructor(box: typeof DatabaseBox) {
    this.box = box;
  }

  static async create(options: Readonly<DatabaseOptions>): Promise<Database> {
    const rawOptions: string = JSON.stringify({
      host: options.host,
      port: options.port,
      name: options.name,
      user: options.user,
      password: options.password,
    });
    const box = await Database.NEW(rawOptions);
    return new Database(box);
  }
}
