import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $Password } from "../password/password.mjs";
import { $OauthClientDisplayName, OauthClientDisplayName } from "./oauth-client-display-name.mjs";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.mjs";

export interface UpsertSystemClientOptions {
  key: OauthClientKey;
  displayName: OauthClientDisplayName;
  appUri: Url;
  callbackUri: Url;
  secret: Uint8Array;
}

export const $UpsertSystemClientOptions: RecordIoType<UpsertSystemClientOptions> = new RecordType<UpsertSystemClientOptions>({
  properties: {
    key: {type: $OauthClientKey},
    displayName: {type: $OauthClientDisplayName},
    appUri: {type: $Url},
    callbackUri: {type: $Url},
    secret: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
