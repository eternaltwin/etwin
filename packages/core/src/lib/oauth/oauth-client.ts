import { RecordIoType } from "kryo/lib/record";

import { $Url, Url } from "../core/url.js";
import { $NullableShortUser, NullableShortUser } from "../user/short-user";
import { $ShortOauthClient, ShortOauthClient } from "./short-oauth-client";

export interface OauthClient extends ShortOauthClient {
  appUri: Url;
  callbackUri: Url;
  owner: NullableShortUser;
}

export const $OauthClient: RecordIoType<OauthClient> = $ShortOauthClient.extend({
  properties: {
    appUri: {type: $Url},
    callbackUri: {type: $Url},
    owner: {type: $NullableShortUser},
  }
});
