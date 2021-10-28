import { Url } from "../core/url.mjs";
import { OauthClientDisplayName } from "./oauth-client-display-name.mjs";
import { OauthClientKey } from "./oauth-client-key.mjs";

export interface TouchStoredSystemClientOptions {
  key: OauthClientKey;
  displayName: OauthClientDisplayName;
  appUri: Url,
  callbackUri: Url,
  secret: Uint8Array;
}
