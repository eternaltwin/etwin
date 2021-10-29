import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.mjs";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface HammerfestUserIdRef {
  type: ObjectType.HammerfestUser;
  server: HammerfestServer;
  id: HammerfestUserId;
}

export const $HammerfestUserIdRef: RecordIoType<HammerfestUserIdRef> = new RecordType<HammerfestUserIdRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
