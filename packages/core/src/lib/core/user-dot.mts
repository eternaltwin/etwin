import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";

/**
 * A point in time associated with a user.
 *
 * Represents an action: when it occurred and who did it.
 */
export interface UserDot {
  time: Date;
  user: ShortUser;
}

export const $UserDot: RecordIoType<UserDot> = new RecordType<UserDot>({
  properties: {
    time: {type: $Date},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableUserDot = null | UserDot;

export const $NullableUserDot: TryUnionType<NullableUserDot> = new TryUnionType({variants: [$Null, $UserDot]});
