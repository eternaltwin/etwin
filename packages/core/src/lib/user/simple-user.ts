import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $FieldVersions, FieldVersions } from "../core/field-versions.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Represents an Eternal-Twin simple user (without private data).
 *
 * As a simple user, it only has data directly associated with this user.
 * See `User` for a variant combining data from multiple sources (linked users, forum roles, profile events, etc.).
 */
export interface SimpleUser {
  type: ObjectType.User;

  id: UserId;

  createdAt: Date;

  displayName: FieldVersions<UserDisplayName>;

  isAdministrator: boolean;
}

export const $SimpleUser: RecordIoType<SimpleUser> = new RecordType<SimpleUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    createdAt: {type: $Date},
    displayName: {type: $FieldVersions.apply($UserDisplayName) as RecordIoType<FieldVersions<UserDisplayName>>},
    isAdministrator: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
