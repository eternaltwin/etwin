import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestUserRef, HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestGodChild {
  user: HammerfestUserRef;
  tokens: number;
}

export const $HammerfestGodChild: RecordIoType<HammerfestGodChild> = new RecordType<HammerfestGodChild>({
  properties: {
    user: {type: $HammerfestUserRef},
    tokens: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});
