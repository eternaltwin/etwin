import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcItemCounts, DinoparcItemCounts } from "./dinoparc-item-counts.js";
import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.js";

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
