import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $HammerfestSessionKey, HammerfestSessionKey } from "./hammerfest-session-key.js";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestSession {
  ctime: Date;
  atime: Date;
  key: HammerfestSessionKey;
  user: ShortHammerfestUser;
}

export const $HammerfestSession: RecordIoType<HammerfestSession> = new RecordType<HammerfestSession>({
  properties: {
    ctime: {type: $Date},
    atime: {type: $Date},
    key: {type: $HammerfestSessionKey},
    user: {type: $ShortHammerfestUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestSession = null | HammerfestSession;

export const $NullableHammerfestSession: TryUnionType<NullableHammerfestSession> = new TryUnionType({variants: [$Null, $HammerfestSession]});
