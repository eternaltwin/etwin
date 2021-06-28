import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.js";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

/**
 * A Twinoid user retrieved from the store.
 */
export interface ArchivedTwinoidUser {
  type: ObjectType.TwinoidUser;
  id: TwinoidUserId;
  archivedAt: Date;
  displayName: TwinoidUserDisplayName;
}

export const $ArchivedTwinoidUser: RecordIoType<ArchivedTwinoidUser> = new RecordType<ArchivedTwinoidUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.TwinoidUser})},
    id: {type: $TwinoidUserId},
    archivedAt: {type: $Date},
    displayName: {type: $TwinoidUserDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableArchivedTwinoidUser = null | ArchivedTwinoidUser;

export const $NullableArchivedTwinoidUser: TryUnionType<NullableArchivedTwinoidUser> = new TryUnionType({variants: [$Null, $ArchivedTwinoidUser]});
