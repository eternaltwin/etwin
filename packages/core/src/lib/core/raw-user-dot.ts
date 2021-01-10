import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

/**
 * A point in time associated with a user id.
 *
 * Represents an action: when it occurred and who did it.
 */
export interface RawUserDot {
  time: Date;
  user: UserIdRef;
}

export const $RawUserDot: RecordIoType<RawUserDot> = new RecordType<RawUserDot>({
  properties: {
    time: {type: $Date},
    user: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableRawUserDot = null | RawUserDot;

export const $NullableRawUserDot: TryUnionType<NullableRawUserDot> = new TryUnionType({variants: [$Null, $RawUserDot]});
