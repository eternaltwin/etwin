import { RecordIoType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $NullableShortUser, NullableShortUser } from "../user/short-user.mjs";
import { $ShortOauthClient, ShortOauthClient } from "./short-oauth-client.mjs";

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
