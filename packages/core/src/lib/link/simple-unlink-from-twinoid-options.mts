import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";

export interface SimpleUnlinkFromTwinoidOptions {
  userId: UserId;
  twinoidUserId: TwinoidUserId;
  unlinkedBy: UserId;
}

export const $SimpleUnlinkFromTwinoidOptions: RecordIoType<SimpleUnlinkFromTwinoidOptions> = new RecordType<SimpleUnlinkFromTwinoidOptions>({
  properties: {
    userId: {type: $UserId},
    twinoidUserId: {type: $TwinoidUserId},
    unlinkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
