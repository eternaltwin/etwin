import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $EmailLogin, EmailLogin } from "./email-login.js";
import { $OauthClientIdLogin, OauthClientIdLogin } from "./oauth-client-id-login.js";
import { $OauthClientKeyLogin, OauthClientKeyLogin } from "./oauth-client-key-login.js";
import { $UserIdLogin, UserIdLogin } from "./user-id-login.js";
import { $UsernameLogin, UsernameLogin } from "./username-login.js";
import { $UuidLogin, UuidLogin } from "./uuid-login.js";

export type Login =
  EmailLogin
  | OauthClientIdLogin
  | OauthClientKeyLogin
  | UserIdLogin
  | UsernameLogin
  | UuidLogin;

export const $Login: TaggedUnionType<Login> = new TaggedUnionType<Login>({
  variants: [$EmailLogin, $OauthClientKeyLogin, $OauthClientIdLogin, $UserIdLogin, $UsernameLogin, $UuidLogin],
  tag: "type",
});
