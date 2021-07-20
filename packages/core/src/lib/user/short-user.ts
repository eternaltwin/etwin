import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $FieldShortVersions, FieldShortVersions } from "../core/field-short-versions.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Represents a reference to an Eternal-Twin user, with enough to display it.
 */
export interface ShortUser {
  type: ObjectType.User;

  id: UserId;

  displayName: FieldShortVersions<UserDisplayName>;
}

export const $ShortUser: RecordIoType<ShortUser> = new RecordType<ShortUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $FieldShortVersions.apply($UserDisplayName) as RecordIoType<FieldShortVersions<UserDisplayName>>},
  },
  changeCase: CaseStyle.SnakeCase,
});

/**
 * A short user that may be null.
 */
export type NullableShortUser = null | ShortUser;

export const $NullableShortUser: TryUnionType<NullableShortUser> = new TryUnionType({variants: [$Null, $ShortUser]});
