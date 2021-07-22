import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestItemCounts, HammerfestItemCounts } from "./hammerfest-item-counts.js";
import { $HammerfestSessionUser, HammerfestSessionUser } from "./hammerfest-session-user.js";

export interface HammerfestInventoryResponse {
  session: HammerfestSessionUser;
  inventory: HammerfestItemCounts;
}

export const $HammerfestInventoryResponse: RecordIoType<HammerfestInventoryResponse> = new RecordType<HammerfestInventoryResponse>({
  properties: {
    session: {type: $HammerfestSessionUser},
    inventory: {type: $HammerfestItemCounts},
  },
  changeCase: CaseStyle.SnakeCase,
});
