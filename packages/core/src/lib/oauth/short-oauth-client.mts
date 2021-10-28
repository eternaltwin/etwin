import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $OauthClientDisplayName, OauthClientDisplayName } from "./oauth-client-display-name.mjs";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.mjs";
import { $NullableOauthClientKey, NullableOauthClientKey } from "./oauth-client-key.mjs";

export interface ShortOauthClient {
  type: ObjectType.OauthClient;
  id: OauthClientId;
  key: NullableOauthClientKey;
  displayName: OauthClientDisplayName;
}

export const $ShortOauthClient: RecordIoType<ShortOauthClient> = new RecordType<ShortOauthClient>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.OauthClient})},
    id: {type: $OauthClientId},
    key: {type: $NullableOauthClientKey},
    displayName: {type: $OauthClientDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});
