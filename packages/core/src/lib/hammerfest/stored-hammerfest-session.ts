import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $HammerfestSessionKey, HammerfestSessionKey } from "./hammerfest-session-key.js";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "./hammerfest-user-id-ref.js";

export interface StoredHammerfestSession {
  ctime: Date;
  atime: Date;
  key: HammerfestSessionKey;
  user: HammerfestUserIdRef;
}

export const $StoredHammerfestSession: RecordIoType<StoredHammerfestSession> = new RecordType<StoredHammerfestSession>({
  properties: {
    ctime: {type: $Date},
    atime: {type: $Date},
    key: {type: $HammerfestSessionKey},
    user: {type: $HammerfestUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableStoredHammerfestSession = null | StoredHammerfestSession;

export const $NullableStoredHammerfestSession: TryUnionType<NullableStoredHammerfestSession> = new TryUnionType({variants: [$Null, $StoredHammerfestSession]});
