import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.mjs";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.mjs";

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
