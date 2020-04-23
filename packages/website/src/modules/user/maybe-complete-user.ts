import { $CompleteUser, CompleteUser } from "@eternal-twin/etwin-api-types/lib/user/complete-user.js";
import { $User, User } from "@eternal-twin/etwin-api-types/lib/user/user.js";
import { TryUnionType } from "kryo/lib/try-union.js";

export type MaybeCompleteUser = CompleteUser | User;

export const $MaybeCompleteUser: TryUnionType<MaybeCompleteUser> = new TryUnionType<MaybeCompleteUser>({
  variants: [$CompleteUser, $User],
});
