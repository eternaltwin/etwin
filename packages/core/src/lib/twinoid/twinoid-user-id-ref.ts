import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

/**
 * A reference uniquely identifying a Twinoid user.
 */
export interface TwinoidUserIdRef {
  type: ObjectType.TwinoidUser;
  id: TwinoidUserId;
}

export const $TwinoidUserIdRef: RecordIoType<TwinoidUserIdRef> = new RecordType<TwinoidUserIdRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.TwinoidUser})},
    id: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
