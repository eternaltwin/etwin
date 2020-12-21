import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $FieldVersions, FieldVersions } from "../core/field-versions.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $VersionedLinks, VersionedLinks } from "../link/versioned-links.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Main user interface.
 *
 * Aggregates data from multiple services to present the full user.
 */
export interface User {
  type: ObjectType.User;

  id: UserId;

  createdAt: Date;

  displayName: FieldVersions<UserDisplayName>;

  isAdministrator: boolean;

  links: VersionedLinks;
}

export const $User: RecordIoType<User> = new RecordType<User>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    createdAt: {type: $Date},
    displayName: {type: $FieldVersions.apply($UserDisplayName) as RecordIoType<FieldVersions<UserDisplayName>>},
    isAdministrator: {type: $Boolean},
    links: {type: $VersionedLinks},
  },
  changeCase: CaseStyle.SnakeCase,
});
