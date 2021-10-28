import { RecordIoType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $NullableUserIdRef, NullableUserIdRef } from "../user/user-id-ref.mjs";
import { $ShortOauthClient, ShortOauthClient } from "./short-oauth-client.mjs";

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
