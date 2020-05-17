import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $AccessTokenAuthContext, AccessTokenAuthContext } from "./access-token-auth-context.js";
import { $GuestAuthContext, GuestAuthContext } from "./guest-auth-context.js";
import { $OauthClientAuthContext, OauthClientAuthContext } from "./oauth-client-auth-context.js";
import { $SystemAuthContext, SystemAuthContext } from "./system-auth-context.js";
import { $UserAuthContext, UserAuthContext } from "./user-auth-context.js";

export type AuthContext =
  AccessTokenAuthContext
  | GuestAuthContext
  | OauthClientAuthContext
  | UserAuthContext
  | SystemAuthContext;

export const $AuthContext: TaggedUnionType<AuthContext> = new TaggedUnionType<AuthContext>({
  variants: [$AccessTokenAuthContext, $GuestAuthContext, $OauthClientAuthContext, $UserAuthContext, $SystemAuthContext],
  tag: "type",
});
