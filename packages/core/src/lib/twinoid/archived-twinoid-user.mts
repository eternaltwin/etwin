import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.mjs";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.mjs";

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
