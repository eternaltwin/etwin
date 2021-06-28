import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.js";

export interface OauthClientKeyRef {
  type: ObjectType.OauthClient;
  id?: OauthClientId;
  key: OauthClientKey;
}

export const $OauthClientKeyRef: RecordIoType<OauthClientKeyRef> = new RecordType<OauthClientKeyRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.OauthClient})},
    id: {type: $OauthClientId, optional: true},
    key: {type: $OauthClientKey},
  },
  changeCase: CaseStyle.SnakeCase,
});
