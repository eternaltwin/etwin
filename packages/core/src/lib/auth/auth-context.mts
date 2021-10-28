import { TaggedUnionType } from "kryo/tagged-union";

import { $AccessTokenAuthContext, AccessTokenAuthContext } from "./access-token-auth-context.mjs";
import { $GuestAuthContext, GuestAuthContext } from "./guest-auth-context.mjs";
import { $OauthClientAuthContext, OauthClientAuthContext } from "./oauth-client-auth-context.mjs";
import { $SystemAuthContext, SystemAuthContext } from "./system-auth-context.mjs";
import { $UserAuthContext, UserAuthContext } from "./user-auth-context.mjs";

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
