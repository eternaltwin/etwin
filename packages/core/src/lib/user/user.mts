import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $FieldVersions, FieldVersions } from "../core/field-versions.mjs";
import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $VersionedLinks, VersionedLinks } from "../link/versioned-links.mjs";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.mjs";
import { $UserId, UserId } from "./user-id.mjs";

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
