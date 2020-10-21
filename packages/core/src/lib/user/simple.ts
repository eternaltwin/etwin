import { AuthContext } from "../auth/auth-context.js";
import { GetUserByIdOptions } from "./get-user-by-id-options.js";
import { MaybeCompleteSimpleUser } from "./maybe-complete-simple-user.js";
import { ShortUser } from "./short-user.js";

export interface SimpleUserService {
  getUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<MaybeCompleteSimpleUser | null>;

  getShortUserById(acx: AuthContext, options: Readonly<GetUserByIdOptions>): Promise<ShortUser | null>;
}
