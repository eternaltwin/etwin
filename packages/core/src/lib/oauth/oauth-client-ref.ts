import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $OauthClientDisplayName, OauthClientDisplayName } from "./oauth-client-display-name.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $NullableOauthClientKey, NullableOauthClientKey } from "./oauth-client-key.js";

export interface OauthClientRef {
  type: ObjectType.OauthClient;
  id: OauthClientId;
  key: NullableOauthClientKey;
  displayName: OauthClientDisplayName;
}

export const $OauthClientRef: RecordIoType<OauthClientRef> = new RecordType<OauthClientRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.OauthClient})},
    id: {type: $OauthClientId},
    key: {type: $NullableOauthClientKey},
    displayName: {type: $OauthClientDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});
