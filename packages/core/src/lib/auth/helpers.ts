import { $UuidHex } from "../core/uuid-hex.js";
import { $EmailAddress } from "../email/email-address.js";
import { $EtwinOauthClientId } from "../oauth/etwin/etwin-oauth-client-id.js";
import { $OauthClientKey } from "../oauth/oauth-client-key.js";
import { $UserId } from "../user/user-id.js";
import { $Username } from "../user/username.js";
import { LoginType } from "./login-type.js";
import { Login } from "./login.js";

const USER_SUFFIX = "@users";
const CLIENT_SUFFIX = "@clients";

export function readLogin(raw: unknown): Login {
  if (typeof raw !== "string") {
    throw new Error("InvalidLogin");
  }
  if (raw.endsWith(CLIENT_SUFFIX)) {
    const idOrKey: string = raw.substr(0, raw.length - CLIENT_SUFFIX.length);
    if ($EtwinOauthClientId.test(idOrKey)) {
      return {type: LoginType.OauthClientId, value: idOrKey};
    } else if ($OauthClientKey.test(idOrKey)) {
      return {type: LoginType.OauthClientKey, value: idOrKey};
    } else {
      throw new Error("InvalidLogin");
    }
  } else if (raw.endsWith(USER_SUFFIX)) {
    const idOrUsername: string = raw.substr(0, raw.length - USER_SUFFIX.length);
    if ($UserId.test(idOrUsername)) {
      return {type: LoginType.UserId, value: idOrUsername};
    } else if ($Username.test(idOrUsername)) {
      return {type: LoginType.Username, value: idOrUsername};
    } else {
      throw new Error("InvalidLogin");
    }
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
