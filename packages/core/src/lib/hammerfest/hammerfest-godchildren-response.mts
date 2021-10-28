import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestGodChild, HammerfestGodChild } from "./hammerfest-god-child.mjs";
import {
  $NullableHammerfestSessionUser,
  NullableHammerfestSessionUser
} from "./hammerfest-session-user.mjs";

export interface HammerfestGodchildrenResponse {
  session: NullableHammerfestSessionUser;
  godchildren: HammerfestGodChild[];
}

export const $HammerfestGodchildrenResponse: RecordIoType<HammerfestGodchildrenResponse> = new RecordType<HammerfestGodchildrenResponse>({
  properties: {
    session: {type: $NullableHammerfestSessionUser},
    godchildren: {type: new ArrayType({itemType: $HammerfestGodChild, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
