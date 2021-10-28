import { Url } from "../core/url.mjs";
import { OauthClientDisplayName } from "./oauth-client-display-name.mjs";

export interface CreateOrUpdateSystemClientOptions {
  displayName: OauthClientDisplayName;
  appUri: Url,
  callbackUri: Url,
  secret: Uint8Array;
}
