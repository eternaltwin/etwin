import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestLogin, HammerfestLogin } from "./hammerfest-login.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface HammerfestUserRef {
  server: HammerfestServer;
  id: HammerfestUserId;
  login: HammerfestLogin;
}

export const $HammerfestUserRef: RecordIoType<HammerfestUserRef> = new RecordType<HammerfestUserRef>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    login: {type: $HammerfestLogin},
  },
  changeCase: CaseStyle.SnakeCase,
});
