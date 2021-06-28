import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $FieldVersions, FieldVersions } from "../core/field-versions.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $UserId, UserId } from "./user-id.js";
import { $NullableUsername, NullableUsername } from "./username.js";

/**
 * Represents an Eternal-Twin user (including private data).
 */
export interface CompleteSimpleUser {
  type: ObjectType.User;

  id: UserId;

  createdAt: Date;

  displayName: FieldVersions<UserDisplayName>;

  isAdministrator: boolean;

  username: NullableUsername;

  emailAddress: NullableEmailAddress;
}

export const $CompleteSimpleUser: RecordIoType<CompleteSimpleUser> = new RecordType<CompleteSimpleUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.User})},
    id: {type: $UserId},
    createdAt: {type: $Date},
    displayName: {type: $FieldVersions.apply($UserDisplayName) as RecordIoType<FieldVersions<UserDisplayName>>},
    isAdministrator: {type: $Boolean},
    username: {type: $NullableUsername},
    emailAddress: {type: $NullableEmailAddress},
  },
  changeCase: CaseStyle.SnakeCase,
});
