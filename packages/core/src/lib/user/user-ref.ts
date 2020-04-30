import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Represents a reference to an Eternal-Twin user.
 */
export interface UserRef {
  type: ObjectType.User;

  id: UserId;

  displayName: UserDisplayName;
}

export const $UserRef: RecordIoType<UserRef> = new RecordType<UserRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $UserDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});

/**
 * A user reference that may be null.
 */
export type NullableUserRef = null | UserRef;

export const $NullableUserRef: TryUnionType<NullableUserRef> = new TryUnionType({variants: [$Null, $UserRef]});
