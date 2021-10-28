import { TryUnionType } from "kryo/try-union";

import { $CompleteUser, CompleteUser } from "./complete-user.mjs";
import { $User, User } from "./user.mjs";

export type MaybeCompleteUser = CompleteUser | User;

export const $MaybeCompleteUser: TryUnionType<MaybeCompleteUser> = new TryUnionType<MaybeCompleteUser>({
  variants: [$CompleteUser, $User],
});
