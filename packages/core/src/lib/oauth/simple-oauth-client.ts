import { RecordIoType } from "kryo/record";

import { $Url, Url } from "../core/url.js";
import { $NullableUserIdRef, NullableUserIdRef } from "../user/user-id-ref.js";
import { $ShortOauthClient, ShortOauthClient } from "./short-oauth-client.js";

export interface SimpleOauthClient extends ShortOauthClient {
  appUri: Url;
  callbackUri: Url;
  owner: NullableUserIdRef;
}

export const $SimpleOauthClient: RecordIoType<SimpleOauthClient> = $ShortOauthClient.extend({
  properties: {
    appUri: {type: $Url},
    callbackUri: {type: $Url},
    owner: {type: $NullableUserIdRef},
  }
});
