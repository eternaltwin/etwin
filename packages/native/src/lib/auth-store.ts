import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";
import { NativeUuidGenerator } from "./uuid.js";

declare const MemAuthStoreBox: unique symbol;
declare const PgAuthStoreBox: unique symbol;
export type NativeAuthStoreBox = typeof MemAuthStoreBox | typeof PgAuthStoreBox;

export abstract class NativeAuthStore {
  public readonly box: NativeAuthStoreBox;

  constructor(box: NativeAuthStoreBox) {
    this.box = box;
  }
}

export interface MemAuthStoreOptions {
  clock: NativeClock;
  uuidGenerator: NativeUuidGenerator;
}

export class MemAuthStore extends NativeAuthStore {
  private static NEW = promisify(native.authStore.mem.new);

  private constructor(box: typeof MemAuthStoreBox) {
    super(box);
  }

  static async create(options: Readonly<MemAuthStoreOptions>): Promise<MemAuthStore> {
    const box = await MemAuthStore.NEW(options.clock.box, options.uuidGenerator.box);
    return new MemAuthStore(box);
  }
}

export interface PgAuthStoreOptions {
  clock: NativeClock;
  database: Database;
  uuidGenerator: NativeUuidGenerator;
  secret: string;
}

export class PgAuthStore extends NativeAuthStore {
  private static NEW = promisify(native.authStore.pg.new);

  private constructor(box: typeof PgAuthStoreBox) {
    super(box);
  }

  static async create(options: Readonly<PgAuthStoreOptions>): Promise<PgAuthStore> {
    return new PgAuthStore(await PgAuthStore.NEW(options.clock.box, options.database.box, options.uuidGenerator.box, options.secret));
  }
}
