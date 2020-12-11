import { AuthContext } from "../auth/auth-context.js";
import { CreateUserOptions } from "./create-user-options.js";
import { GetUserByEmailOptions } from "./get-user-by-email-options.js";
import { GetUserByIdOptions } from "./get-user-by-id-options.js";
import { GetUserByUsernameOptions } from "./get-user-by-username-options.js";
import { MaybeCompleteSimpleUser } from "./maybe-complete-simple-user.js";
import { ShortUser } from "./short-user.js";
import { SimpleUser } from "./simple-user.js";
import { UserId } from "./user-id.js";

export interface SimpleUserService {
  createUser(acx: AuthContext, options: Readonly<CreateUserOptions>): Promise<SimpleUser>;

  getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteSimpleUser | null>;

  getShortUserByEmail(acx: AuthContext, options: Readonly<GetUserByEmailOptions>): Promise<ShortUser | null>;

  getShortUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null>;

  getShortUserByUsername(acx: AuthContext, options: Readonly<GetUserByUsernameOptions>): Promise<ShortUser | null>;

  hardDeleteUserById(acx: AuthContext, userId: UserId): Promise<void>;
}
