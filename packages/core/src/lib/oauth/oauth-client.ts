import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $Url, Url } from "../core/url.js";
import { $NullableShortUser, NullableShortUser } from "../user/short-user";
import { $OauthClientDisplayName, OauthClientDisplayName } from "./oauth-client-display-name.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $NullableOauthClientKey, NullableOauthClientKey } from "./oauth-client-key";

export interface OauthClient {
  type: ObjectType.OauthClient;
  id: OauthClientId;
  key: NullableOauthClientKey;
  displayName: OauthClientDisplayName;
  appUri: Url;
  callbackUri: Url;
  owner: NullableShortUser;
}

export const $OauthClient: RecordIoType<OauthClient> = new RecordType<OauthClient>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.OauthClient})},
    id: {type: $OauthClientId},
    key: {type: $NullableOauthClientKey},
    displayName: {type: $OauthClientDisplayName},
    appUri: {type: $Url},
    callbackUri: {type: $Url},
    owner: {type: $NullableShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
