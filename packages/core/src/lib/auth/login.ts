import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $EmailLogin, EmailLogin } from "./email-login.js";
import { $OauthClientKeyLogin, OauthClientKeyLogin } from "./oauth-client-key-login.js";
import { $UsernameLogin, UsernameLogin } from "./username-login.js";
import { $UuidLogin, UuidLogin } from "./uuid-login.js";

export type Login =
  EmailLogin
  | OauthClientKeyLogin
  | UsernameLogin
  | UuidLogin;

export const $Login: TaggedUnionType<Login> = new TaggedUnionType<Login>({
  variants: [$EmailLogin, $OauthClientKeyLogin, $UsernameLogin, $UuidLogin],
  tag: "type",
});
