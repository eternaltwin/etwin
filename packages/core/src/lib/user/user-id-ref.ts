import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserId, UserId } from "./user-id.js";

/**
 * Wrapper object for a user id.
 */
export interface UserIdRef {
  userId: UserId;
}

export const $UserIdRef: RecordIoType<UserIdRef> = new RecordType<UserIdRef>({
  properties: {
    userId: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
