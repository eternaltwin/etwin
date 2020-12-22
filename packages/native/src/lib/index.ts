import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import {
  $NullableShortDinoparcUser,
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
    return native.clock.systemClock.now(this.box);
  }

  nowUnixS(): number {
    return native.clock.systemClock.nowUnixS(this.box);
  }

  nowUnixMs(): number {
    return native.clock.systemClock.nowUnixMs(this.box);
  }
}

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
  clock: SystemClock;
}

declare const MemDinoparcStoreBox: unique symbol;

export class MemDinoparcStore implements DinoparcStore {
  public readonly box: typeof MemDinoparcStoreBox;
  private static GET_SHORT_USER = promisify(native.dinoparcStore.mem.getShortUser);
  private static TOUCH_SHORT_USER = promisify(native.dinoparcStore.mem.touchShortUser);

  constructor(options: Readonly<MemDinoparcStoreOptions>) {
    this.box = native.dinoparcStore.mem.new(options.clock.box);
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ShortDinoparcUser | null> {
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await MemDinoparcStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableShortDinoparcUser.read(JSON_READER, rawOut);
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser> {
    const rawShort: string = $ShortDinoparcUser.write(JSON_WRITER, short);
    const rawOut = await MemDinoparcStore.TOUCH_SHORT_USER(this.box, rawShort);
    return $ShortDinoparcUser.read(JSON_READER, rawOut);
  }
}
