import { CompleteIfSelfUserFields } from "./complete-if-self-user-fields.mjs";
import { CompleteSimpleUser } from "./complete-simple-user.mjs";
import { CompleteUserFields } from "./complete-user-fields.mjs";
import { CreateUserOptions } from "./create-user-options.mjs";
import { DefaultUserFields } from "./default-user-fields.mjs";
import { GetUserOptions } from "./get-user-options.mjs";
import { ShortUser } from "./short-user.mjs";
import { ShortUserFields } from "./short-user-fields.mjs";
import { ShortUserWithPassword } from "./short-user-with-password.mjs";
import { SimpleUser } from "./simple-user.mjs";
import { UpdateStoreUserOptions } from "./update-store-user-options.mjs";
import { UserId } from "./user-id.mjs";

export interface UserStore {
  createUser(options: Readonly<CreateUserOptions>): Promise<SimpleUser>;

  getUserWithPassword(options: Readonly<GetUserOptions>): Promise<ShortUserWithPassword | null>;

  getUser(options: Readonly<GetUserOptions & {fields: ShortUserFields}>): Promise<ShortUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: DefaultUserFields}>): Promise<SimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: CompleteUserFields}>): Promise<CompleteSimpleUser | null>;
  getUser(options: Readonly<GetUserOptions & {fields: DefaultUserFields | CompleteUserFields | CompleteIfSelfUserFields}>): Promise<SimpleUser | CompleteSimpleUser | null>;
  getUser(options: Readonly<GetUserOptions>): Promise<ShortUser | SimpleUser | CompleteSimpleUser | null>;

  hardDeleteUser(userId: UserId): Promise<void>;

  updateUser(options: Readonly<UpdateStoreUserOptions>): Promise<CompleteSimpleUser>;
}
