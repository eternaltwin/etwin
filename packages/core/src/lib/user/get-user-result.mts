import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";

import { $CompleteSimpleUser, CompleteSimpleUser } from "./complete-simple-user.mjs";
import { $ShortUser, ShortUser } from "./short-user.mjs";
import { $SimpleUser, SimpleUser } from "./simple-user.mjs";

export type GetUserResult = ShortUser | SimpleUser | CompleteSimpleUser;

export const $GetUserResult: TryUnionType<GetUserResult> = new TryUnionType<GetUserResult>({
  variants: [$CompleteSimpleUser, $SimpleUser, $ShortUser],
});

export type NullableGetUserResult = null | GetUserResult;

export const $NullableGetUserResult: TryUnionType<NullableGetUserResult> = new TryUnionType({variants: [$Null, $GetUserResult]});
