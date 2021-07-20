import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { $UserId, UserId } from "../user/user-id.js";

export interface SimpleLinkToTwinoidOptions {
  userId: UserId;
  twinoidUserId: TwinoidUserId;
  linkedBy: UserId;
}

export const $SimpleLinkToTwinoidOptions: RecordIoType<SimpleLinkToTwinoidOptions> = new RecordType<SimpleLinkToTwinoidOptions>({
  properties: {
    userId: {type: $UserId},
    twinoidUserId: {type: $TwinoidUserId},
    linkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
