import { $SimpleOauthClient, SimpleOauthClient } from "@eternal-twin/core/oauth/simple-oauth-client";
import {
  $UpsertSystemClientOptions,
  UpsertSystemClientOptions
} from "@eternal-twin/core/oauth/upsert-system-client-options";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";
import { Database } from "./database.mjs";
import { NativePasswordService } from "./password.mjs";
import { NativeUuidGenerator } from "./uuid.mjs";

declare const MemOauthProviderStoreBox: unique symbol;
declare const PgOauthProviderStoreBox: unique symbol;
export type NativeOauthProviderStoreBox = typeof MemOauthProviderStoreBox | typeof PgOauthProviderStoreBox;

export abstract class NativeOauthProviderStore {
  public readonly box: NativeOauthProviderStoreBox;
  private static UPSERT_SYSTEM_CLIENT = promisify(native.oauthProviderStore.upsertSystemClient);

  constructor(box: NativeOauthProviderStoreBox) {
    this.box = box;
  }

  async upsertSystemClient(options: UpsertSystemClientOptions): Promise<SimpleOauthClient> {
    const rawOptions: string = $UpsertSystemClientOptions.write(JSON_WRITER, options);
    const rawOut = await NativeOauthProviderStore.UPSERT_SYSTEM_CLIENT(this.box, rawOptions);
    return $SimpleOauthClient.read(JSON_READER, rawOut);
  }
}

export interface MemOauthProviderStoreOptions {
  clock: NativeClock;
  passwordService: NativePasswordService;
  uuidGenerator: NativeUuidGenerator;
}

export class MemOauthProviderStore extends NativeOauthProviderStore {
  private static NEW = promisify(native.oauthProviderStore.mem.new);

  private constructor(box: typeof MemOauthProviderStoreBox) {
    super(box);
  }

  static async create(options: Readonly<MemOauthProviderStoreOptions>): Promise<MemOauthProviderStore> {
    return new MemOauthProviderStore(await MemOauthProviderStore.NEW(options.clock.box, options.passwordService.box, options.uuidGenerator.box));
  }
}

export interface PgOauthProviderStoreOptions {
  clock: NativeClock;
  database: Database;
  passwordService: NativePasswordService;
  uuidGenerator: NativeUuidGenerator;
  secret: string;
}

export class PgOauthProviderStore extends NativeOauthProviderStore {
  private static NEW = promisify(native.oauthProviderStore.pg.new);

  private constructor(box: typeof PgOauthProviderStoreBox) {
    super(box);
  }

  static async create(options: Readonly<PgOauthProviderStoreOptions>): Promise<PgOauthProviderStore> {
    return new PgOauthProviderStore(await PgOauthProviderStore.NEW(options.clock.box, options.database.box, options.passwordService.box, options.uuidGenerator.box, options.secret));
  }
}
