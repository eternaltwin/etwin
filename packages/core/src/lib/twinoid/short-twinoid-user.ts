import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.js";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

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
