import { Url } from "../core/url.js";
import { OauthClientDisplayName } from "./oauth-client-display-name.js";
import { OauthClientKey } from "./oauth-client-key.js";

export interface TouchStoredSystemClientOptions {
  key: OauthClientKey;
  displayName: OauthClientDisplayName;
  appUri: Url,
  callbackUri: Url,
  secret: Uint8Array;
}
