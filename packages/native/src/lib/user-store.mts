import { ObjectType } from "@eternal-twin/core/core/object-type";
import { CompleteIfSelfUserFields } from "@eternal-twin/core/user/complete-if-self-user-fields";
import { $CompleteSimpleUser, CompleteSimpleUser } from "@eternal-twin/core/user/complete-simple-user";
import { CompleteUserFields } from "@eternal-twin/core/user/complete-user-fields";
import { $CreateUserOptions, CreateUserOptions } from "@eternal-twin/core/user/create-user-options";
import { DefaultUserFields } from "@eternal-twin/core/user/default-user-fields";
import { $GetShortUserOptions, GetShortUserOptions } from "@eternal-twin/core/user/get-short-user-options";
import { $GetUserOptions, GetUserOptions } from "@eternal-twin/core/user/get-user-options";
import { $NullableGetUserResult } from "@eternal-twin/core/user/get-user-result";
import { $NullableShortUser, ShortUser } from "@eternal-twin/core/user/short-user";
import { ShortUserFields } from "@eternal-twin/core/user/short-user-fields";
import {
  $NullableShortUserWithPassword,
  ShortUserWithPassword
} from "@eternal-twin/core/user/short-user-with-password";
import { SimpleUser } from "@eternal-twin/core/user/simple-user";
import { UserStore } from "@eternal-twin/core/user/store";
import { $UpdateStoreUserOptions, UpdateStoreUserOptions } from "@eternal-twin/core/user/update-store-user-options";
import { UserId } from "@eternal-twin/core/user/user-id";
import { $UserIdRef } from "@eternal-twin/core/user/user-id-ref";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";
import { Database } from "./database.mjs";
import { NativeUuidGenerator } from "./uuid.mjs";

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
