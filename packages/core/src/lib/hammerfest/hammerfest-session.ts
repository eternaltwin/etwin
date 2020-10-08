import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestSessionKey, HammerfestSessionKey } from "./hammerfest-session-key.js";
import { $HammerfestUserRef, HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestSession {
  ctime: Date;
  atime: Date;
  key: HammerfestSessionKey;
  user: HammerfestUserRef;
}

export const $HammerfestSession: RecordIoType<HammerfestSession> = new RecordType<HammerfestSession>({
  properties: {
    ctime: {type: $Date},
    atime: {type: $Date},
    key: {type: $HammerfestSessionKey},
    user: {type: $HammerfestUserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
