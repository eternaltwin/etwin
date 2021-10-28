import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.mjs";

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
