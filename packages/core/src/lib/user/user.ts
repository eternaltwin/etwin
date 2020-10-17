import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $VersionedLinks, VersionedLinks } from "../link/versioned-links.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";

/**
 * Represents an Eternal-Twin user (without private data).
 */
export interface User {
  type: ObjectType.User;

  id: UserId;

  displayName: UserDisplayName;

  isAdministrator: boolean;

  links?: VersionedLinks;
}

export const $User: RecordIoType<User> = new RecordType<User>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $UserDisplayName},
    isAdministrator: {type: $Boolean},
    links: {type: $VersionedLinks, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
