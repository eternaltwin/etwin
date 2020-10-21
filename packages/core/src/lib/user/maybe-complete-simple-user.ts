import { TryUnionType } from "kryo/lib/try-union.js";

import { $CompleteSimpleUser, CompleteSimpleUser } from "./complete-simple-user.js";
import { $SimpleUser, SimpleUser } from "./simple-user.js";

export type MaybeCompleteSimpleUser = CompleteSimpleUser | SimpleUser;

export const $MaybeCompleteSimpleUser: TryUnionType<MaybeCompleteSimpleUser> = new TryUnionType<MaybeCompleteSimpleUser>({
  variants: [$CompleteSimpleUser, $SimpleUser],
});
