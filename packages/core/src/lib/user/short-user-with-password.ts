import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $FieldShortVersions, FieldShortVersions } from "../core/field-short-versions.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $NullablePasswordHash, NullablePasswordHash } from "../password/password-hash.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Represents a reference to an Eternal-Twin user, with enough to display it.
 */
export interface ShortUserWithPassword {
  type: ObjectType.User;

  id: UserId;

  displayName: FieldShortVersions<UserDisplayName>;

  password: NullablePasswordHash;
}

export const $ShortUserWithPassword: RecordIoType<ShortUserWithPassword> = new RecordType<ShortUserWithPassword>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $FieldShortVersions.apply($UserDisplayName) as RecordIoType<FieldShortVersions<UserDisplayName>>},
    password: {type: $NullablePasswordHash},
  },
  changeCase: CaseStyle.SnakeCase,
});

/**
 * A short user that may be null.
 */
export type NullableShortUserWithPassword = null | ShortUserWithPassword;

export const $NullableShortUserWithPassword: TryUnionType<NullableShortUserWithPassword> = new TryUnionType({variants: [$Null, $ShortUserWithPassword]});
