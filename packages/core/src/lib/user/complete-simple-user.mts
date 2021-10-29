import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $FieldVersions, FieldVersions } from "../core/field-versions.mjs";
import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.mjs";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.mjs";
import { $UserId, UserId } from "./user-id.mjs";
import { $NullableUsername, NullableUsername } from "./username.mjs";

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
