import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

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
