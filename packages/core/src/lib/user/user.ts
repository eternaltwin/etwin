import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $VersionedLinks, VersionedLinks } from "../link/versioned-links.js";
import { $UserDisplayNameVersions, UserDisplayNameVersions } from "./user-display-name-versions.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Main user interface.
 *
 * Aggregates data from multiple services to present the full user.
 */
export interface User {
  type: ObjectType.User;

  id: UserId;

  displayName: UserDisplayNameVersions;

  isAdministrator: boolean;

  links: VersionedLinks;
}

export const $User: RecordIoType<User> = new RecordType<User>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $UserDisplayNameVersions},
    isAdministrator: {type: $Boolean},
    links: {type: $VersionedLinks},
  },
  changeCase: CaseStyle.SnakeCase,
});
