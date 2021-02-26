import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { CompleteIfSelfUserFields } from "@eternal-twin/core/lib/user/complete-if-self-user-fields.js";
import { $CompleteSimpleUser, CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { CompleteUserFields } from "@eternal-twin/core/lib/user/complete-user-fields.js";
import { $CreateUserOptions, CreateUserOptions } from "@eternal-twin/core/lib/user/create-user-options.js";
import { DefaultUserFields } from "@eternal-twin/core/lib/user/default-user-fields.js";
import { $GetShortUserOptions, GetShortUserOptions } from "@eternal-twin/core/lib/user/get-short-user-options.js";
import { $GetUserOptions, GetUserOptions } from "@eternal-twin/core/lib/user/get-user-options.js";
import { $NullableGetUserResult } from "@eternal-twin/core/lib/user/get-user-result.js";
import { $NullableShortUser, ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { ShortUserFields } from "@eternal-twin/core/lib/user/short-user-fields.js";
import {
  $NullableShortUserWithPassword,
  ShortUserWithPassword
} from "@eternal-twin/core/lib/user/short-user-with-password.js";
import { SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { UserStore } from "@eternal-twin/core/lib/user/store.js";
import { $UpdateStoreUserOptions, UpdateStoreUserOptions } from "@eternal-twin/core/lib/user/update-store-user-options.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $UserIdRef } from "@eternal-twin/core/lib/user/user-id-ref.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";
import { NativeUuidGenerator } from "./uuid.js";

declare const MemUserStoreBox: unique symbol;
declare const PgUserStoreBox: unique symbol;
export type NativeUserStoreBox = typeof MemUserStoreBox | typeof PgUserStoreBox;

export abstract class NativeUserStore implements UserStore {
  public readonly box: NativeUserStoreBox;
  private static CREATE_USER = promisify(native.userStore.createUser);
  private static GET_USER = promisify(native.userStore.getUser);
  private static GET_USER_WITH_PASSWORD = promisify(native.userStore.getUserWithPassword);
  private static GET_SHORT_USER = promisify(native.userStore.getShortUser);
  private static HARD_DELETE_USER = promisify(native.userStore.hardDeleteUser);
  private static UPDATE_USER = promisify(native.userStore.updateUser);

  constructor(box: NativeUserStoreBox) {
    this.box = box;
  }

  async createUser(options: Readonly<CreateUserOptions>): Promise<CompleteSimpleUser> {
    const rawOptions: string = $CreateUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeUserStore.CREATE_USER(this.box, rawOptions);
    return $CompleteSimpleUser.read(JSON_READER, rawOut);
  }

  getUser(options: Readonly<GetUserOptions & {fields: ShortUserFields}>): Promise<ShortUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: DefaultUserFields}>): Promise<SimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: CompleteUserFields}>): Promise<CompleteSimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: DefaultUserFields | CompleteUserFields | CompleteIfSelfUserFields}>): Promise<SimpleUser | CompleteSimpleUser | null>;
  async getUser(options: Readonly<GetUserOptions>): Promise<ShortUser | SimpleUser | CompleteSimpleUser | null> {
    const rawOptions: string = $GetUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeUserStore.GET_USER(this.box, rawOptions);
    return $NullableGetUserResult.read(JSON_READER, rawOut);
  }

  async getShortUser(options: Readonly<GetShortUserOptions>): Promise<ShortUser | null> {
    const rawOptions: string = $GetShortUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeUserStore.GET_SHORT_USER(this.box, rawOptions);
    return $NullableShortUser.read(JSON_READER, rawOut);
  }

  async getUserWithPassword(options: Readonly<GetUserOptions>): Promise<ShortUserWithPassword | null> {
    const rawOptions: string = $GetUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeUserStore.GET_USER_WITH_PASSWORD(this.box, rawOptions);
    return $NullableShortUserWithPassword.read(JSON_READER, rawOut);
  }

  async updateUser(options: Readonly<UpdateStoreUserOptions>): Promise<CompleteSimpleUser> {
    const rawOptions: string = $UpdateStoreUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeUserStore.UPDATE_USER(this.box, rawOptions);
    return $CompleteSimpleUser.read(JSON_READER, rawOut);
  }

  async hardDeleteUser(userId: UserId): Promise<void> {
    const rawShort: string = $UserIdRef.write(JSON_WRITER, {type: ObjectType.User, id: userId});
    await NativeUserStore.HARD_DELETE_USER(this.box, rawShort);
  }
}

export interface MemUserStoreOptions {
  clock: NativeClock;
  uuidGenerator: NativeUuidGenerator;
}

export class MemUserStore extends NativeUserStore {
  constructor(options: Readonly<MemUserStoreOptions>) {
    super(native.userStore.mem.new(options.clock.box, options.uuidGenerator.box));
  }
}

export interface PgUserStoreOptions {
  clock: NativeClock;
  database: Database;
  databaseSecret: string;
  uuidGenerator: NativeUuidGenerator;
}

export class PgUserStore extends NativeUserStore {
  constructor(options: Readonly<PgUserStoreOptions>) {
    super(native.userStore.pg.new(options.clock.box, options.database.box, options.databaseSecret, options.uuidGenerator.box));
  }
}
