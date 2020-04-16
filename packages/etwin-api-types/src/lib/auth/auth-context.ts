import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $GuestAuthContext, GuestAuthContext } from "./guest-auth-context.js";
import { $UserAuthContext, UserAuthContext } from "./user-auth-context.js";

export type AuthContext = GuestAuthContext | UserAuthContext;

export const $AuthContext: TaggedUnionType<AuthContext> = new TaggedUnionType<AuthContext>({
  variants: [$GuestAuthContext, $UserAuthContext],
  tag: "type",
});
