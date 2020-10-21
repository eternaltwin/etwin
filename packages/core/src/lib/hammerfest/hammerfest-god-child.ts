import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestGodChild {
  user: ShortHammerfestUser;
  tokens: number;
}

export const $HammerfestGodChild: RecordIoType<HammerfestGodChild> = new RecordType<HammerfestGodChild>({
  properties: {
    user: {type: $ShortHammerfestUser},
    tokens: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});
