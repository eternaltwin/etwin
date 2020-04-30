import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $HammerfestLogin, HammerfestLogin } from "./hammerfest-login.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface HammerfestUserRef {
  type: ObjectType.HammerfestUser;
  server: HammerfestServer;
  id: HammerfestUserId;
  login: HammerfestLogin;
}

export const $HammerfestUserRef: RecordIoType<HammerfestUserRef> = new RecordType<HammerfestUserRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    login: {type: $HammerfestLogin},
  },
  changeCase: CaseStyle.SnakeCase,
});
