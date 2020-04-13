import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";

/**
 * Represents a reference to an Eternal-Twin user.
 */
export interface UserRef {
  id: UuidHex;

  displayName: UserDisplayName;
}

export const $UserRef: RecordIoType<UserRef> = new RecordType<UserRef>({
  properties: {
    id: {type: $UuidHex},
    displayName: {type: $UserDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});

/**
 * A user reference that may be null.
 */
export type NullableUserRef = null | UserRef;

export const $NullableUserRef: TryUnionType<NullableUserRef> = new TryUnionType({variants: [$Null, $UserRef]});
