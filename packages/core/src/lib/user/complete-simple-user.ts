import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.js";
import { $UserDisplayNameVersions, UserDisplayNameVersions } from "./user-display-name-versions.js";
import { $UserId, UserId } from "./user-id.js";
import { $NullableUsername, NullableUsername } from "./username.js";

/**
 * Represents an Eternal-Twin user (including private data).
 */
export interface CompleteSimpleUser {
  type: ObjectType.User;

  id: UserId;

  displayName: UserDisplayNameVersions;

  isAdministrator: boolean;

  ctime: Date;

  username: NullableUsername;

  emailAddress: NullableEmailAddress;
}

export const $CompleteSimpleUser: RecordIoType<CompleteSimpleUser> = new RecordType<CompleteSimpleUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    displayName: {type: $UserDisplayNameVersions},
    isAdministrator: {type: $Boolean},
    ctime: {type: $Date},
    username: {type: $NullableUsername},
    emailAddress: {type: $NullableEmailAddress},
  },
  changeCase: CaseStyle.SnakeCase,
});
