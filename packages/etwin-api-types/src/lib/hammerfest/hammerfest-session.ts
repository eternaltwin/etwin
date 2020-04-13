import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestSessionKey, HammerfestSessionKey } from "./hammerfest-session-key.js";
import { $HammerfestUserRef, HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestSession {
  creationDate: Date;
  lastUseDate: Date;
  key: HammerfestSessionKey;
  user: HammerfestUserRef;
}

export const $CreateSessionOptions: RecordIoType<HammerfestSession> = new RecordType<HammerfestSession>({
  properties: {
    creationDate: {type: $Date},
    lastUseDate: {type: $Date},
    key: {type: $HammerfestSessionKey},
    user: {type: $HammerfestUserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
