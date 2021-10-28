import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $UserId, UserId } from "./user-id.mjs";

/**
 * Wrapper object for a user id.
 */
export interface UserIdRef {
  type: ObjectType.User;
  id: UserId;
}

export const $UserIdRef: RecordIoType<UserIdRef> = new RecordType<UserIdRef>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableUserIdRef = null | UserIdRef;

export const $NullableUserIdRef: TryUnionType<NullableUserIdRef> = new TryUnionType({variants: [$Null, $UserIdRef]});
