import { Url } from "../core/url.js";
import { OauthClientDisplayName } from "./oauth-client-display-name.js";

export interface CreateOrUpdateSystemClientOptions {
  displayName: OauthClientDisplayName;
  appUri: Url,
  callbackUri: Url,
  secret: Uint8Array;
}
