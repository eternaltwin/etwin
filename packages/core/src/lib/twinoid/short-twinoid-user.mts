import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.mjs";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.mjs";

/**
 * A Twinoid user with enough data to display it.
 */
export interface ShortTwinoidUser {
  type: ObjectType.TwinoidUser;
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
}

export const $ShortTwinoidUser: RecordIoType<ShortTwinoidUser> = new RecordType<ShortTwinoidUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.TwinoidUser})},
    id: {type: $TwinoidUserId},
    displayName: {type: $TwinoidUserDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableShortTwinoidUser = null | ShortTwinoidUser;

export const $NullableShortTwinoidUser: TryUnionType<NullableShortTwinoidUser> = new TryUnionType({variants: [$Null, $ShortTwinoidUser]});
