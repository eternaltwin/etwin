import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { $UserId, UserId } from "./user-id.js";

export interface UnlinkFromTwinoidOptions {
  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * User id for the Twinoid user.
   */
  twinoidUserId: TwinoidUserId;
}

export const $UnlinkFromTwinoidOptions: RecordIoType<UnlinkFromTwinoidOptions> = new RecordType<UnlinkFromTwinoidOptions>({
  properties: {
    userId: {type: $UserId},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
