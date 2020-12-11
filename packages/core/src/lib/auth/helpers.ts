import { $UuidHex } from "../core/uuid-hex.js";
import { $EmailAddress } from "../email/email-address.js";
import { $OauthClientKey } from "../oauth/oauth-client-key.js";
import { $Username } from "../user/username.js";
import { Login } from "./login.js";
import { LoginType } from "./login-type.js";

const USER_SUFFIX = "@users";

export function readLogin(raw: unknown): Login {
  if (typeof raw !== "string") {
    throw new Error("InvalidLogin");
  }
  if (raw.endsWith(USER_SUFFIX)) {
    const idOrUsername: string = raw.substr(0, raw.length - USER_SUFFIX.length);
    if ($Username.test(idOrUsername)) {
      return {type: LoginType.Username, value: idOrUsername};
    } else {
      throw new Error("InvalidLogin");
    }
  } else if ($OauthClientKey.test(raw)) {
    return {type: LoginType.OauthClientKey, value: raw};
  } else if ($EmailAddress.test(raw)) {
    return {type: LoginType.Email, value: raw};
  } else if ($Username.test(raw)) {
    return {type: LoginType.Username, value: raw};
  } else if ($UuidHex.test(raw)) {
    return {type: LoginType.Uuid, value: raw};
  } else {
    throw new Error("InvalidLogin");
  }
}
