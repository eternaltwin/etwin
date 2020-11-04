import { OauthClientBareKey } from "./oauth-client-bare-key.js";
import { OauthClientInputKey } from "./oauth-client-input-key.js";
import { OauthClientKey } from "./oauth-client-key.js";
import { OauthScopeString } from "./oauth-scope-string";
import { RfcOauthScope } from "./rfc-oauth-scope";

const CLIENT_SUFFIX = "@clients";

export function toOauthClientBareKey(key: OauthClientInputKey): OauthClientBareKey {
  return key.endsWith(CLIENT_SUFFIX) ? key.substr(0, key.length - CLIENT_SUFFIX.length) : key;
}

export function toOauthClientTypedKey(key: OauthClientInputKey): OauthClientKey {
  return key.endsWith(CLIENT_SUFFIX) ? key : `${key}${CLIENT_SUFFIX}`;
}

export function parseScopeString(str: OauthScopeString | null): Set<RfcOauthScope> {
  if (str === null) {
    str = "";
  }
  const rawScopes = str.split(" ")
    .map(x => x.trim())
    .filter(x => x.length > 0);
  const scopes: Set<RfcOauthScope> = new Set();
  scopes.add("base");
  for (const rawScope of rawScopes) {
    if (rawScope !== "base") {
      throw new Error("InvalidScope");
    }
    scopes.add(rawScope);
  }
  return scopes;
}
