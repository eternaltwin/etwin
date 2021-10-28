import { OauthClientBareKey } from "./oauth-client-bare-key.mjs";
import { OauthClientInputKey } from "./oauth-client-input-key.mjs";
import { OauthClientKey } from "./oauth-client-key.mjs";
import { OauthScopeString } from "./oauth-scope-string.mjs";
import { RfcOauthScope } from "./rfc-oauth-scope.mjs";

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
    .map((x: string) => x.trim())
    .filter((x: string) => x.length > 0);
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
