import { $UuidHex } from "../core/uuid-hex.mjs";
import { ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.mjs";
import { $EmailAddress } from "../email/email-address.mjs";
import { ShortHammerfestUser } from "../hammerfest/short-hammerfest-user.mjs";
import { $OauthClientKey } from "../oauth/oauth-client-key.mjs";
import { TwinoidUser } from "../twinoid/twinoid-user.mjs";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.mjs";
import { $Username } from "../user/username.mjs";
import { Login } from "./login.mjs";
import { LoginType } from "./login-type.mjs";

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

export function dinoparcToUserDisplayName(dparcUser: Readonly<ShortDinoparcUser>): UserDisplayName {
  const candidates: string[] = [
    dparcUser.username,
    `dparc_${dparcUser.username}`,
    `dparc_${dparcUser.id}`,
    "dparcPlayer",
  ];
  for (const candidate of candidates) {
    if ($UserDisplayName.test(candidate)) {
      return candidate;
    }
  }
  throw new Error("AssertionError: Failed to derive user display name from Dinoparc");
}

export function hammerfestToUserDisplayName(hfUser: Readonly<ShortHammerfestUser>): UserDisplayName {
  const candidates: string[] = [
    hfUser.username,
    `hf_${hfUser.username}`,
    `hf_${hfUser.id}`,
    "hammerfestPlayer",
  ];
  for (const candidate of candidates) {
    if ($UserDisplayName.test(candidate)) {
      return candidate;
    }
  }
  throw new Error("AssertionError: Failed to derive user display name from Hammerfest");
}

export function twinoidToUserDisplayName(tidUser: Readonly<Pick<TwinoidUser, "id" | "displayName">>): UserDisplayName {
  const candidates: string[] = [
    tidUser.displayName,
    `tid_${tidUser.displayName}`,
    `tid_${tidUser.id}`,
    "twinoidPlayer",
  ];

  for (const candidate of candidates) {
    if ($UserDisplayName.test(candidate)) {
      return candidate;
    }
  }
  throw new Error("AssertionError: Failed to derive user display name from Twinoid");
}
