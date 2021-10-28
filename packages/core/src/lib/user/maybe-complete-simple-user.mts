import { TryUnionType } from "kryo/try-union";

import { $CompleteSimpleUser, CompleteSimpleUser } from "./complete-simple-user.mjs";
import { $SimpleUser, SimpleUser } from "./simple-user.mjs";

export type MaybeCompleteSimpleUser = CompleteSimpleUser | SimpleUser;

export const $MaybeCompleteSimpleUser: TryUnionType<MaybeCompleteSimpleUser> = new TryUnionType<MaybeCompleteSimpleUser>({
  variants: [$CompleteSimpleUser, $SimpleUser],
});
