import { TryUnionType } from "kryo/try-union";

import { $CompleteUser, CompleteUser } from "./complete-user.js";
import { $User, User } from "./user.js";

export type MaybeCompleteUser = CompleteUser | User;

export const $MaybeCompleteUser: TryUnionType<MaybeCompleteUser> = new TryUnionType<MaybeCompleteUser>({
  variants: [$CompleteUser, $User],
});
