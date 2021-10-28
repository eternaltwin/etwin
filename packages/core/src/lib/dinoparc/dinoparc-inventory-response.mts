import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcItemCounts, DinoparcItemCounts } from "./dinoparc-item-counts.mjs";
import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.mjs";

export interface DinoparcInventoryResponse {
  sessionUser: DinoparcSessionUser;
  inventory: DinoparcItemCounts;
}

export const $DinoparcInventoryResponse: RecordIoType<DinoparcInventoryResponse> = new RecordType<DinoparcInventoryResponse>({
  properties: {
    sessionUser: {type: $DinoparcSessionUser},
    inventory: {type: $DinoparcItemCounts},
  },
  changeCase: CaseStyle.SnakeCase,
});
