import { TaggedUnionType } from "kryo/tagged-union";

import { $EmailLogin, EmailLogin } from "./email-login.mjs";
import { $OauthClientKeyLogin, OauthClientKeyLogin } from "./oauth-client-key-login.mjs";
import { $UsernameLogin, UsernameLogin } from "./username-login.mjs";
import { $UuidLogin, UuidLogin } from "./uuid-login.mjs";

export type Login =
  EmailLogin
  | OauthClientKeyLogin
  | UsernameLogin
  | UuidLogin;

export const $Login: TaggedUnionType<Login> = new TaggedUnionType<Login>({
  variants: [$EmailLogin, $OauthClientKeyLogin, $UsernameLogin, $UuidLogin],
  tag: "type",
});
