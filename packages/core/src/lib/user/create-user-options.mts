import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.mjs";
import { $NullablePasswordHash, NullablePasswordHash } from "../password/password-hash.mjs";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.mjs";
import { $NullableUsername, NullableUsername } from "./username.mjs";

export interface CreateUserOptions {
  displayName: UserDisplayName;
  email: NullableEmailAddress;
  username: NullableUsername;
  password: NullablePasswordHash;
}

export const $CreateUserOptions: RecordIoType<CreateUserOptions> = new RecordType<CreateUserOptions>({
  properties: {
    displayName: {type: $UserDisplayName},
    email: {type: $NullableEmailAddress},
    username: {type: $NullableUsername},
    password: {type: $NullablePasswordHash},
  },
  changeCase: CaseStyle.SnakeCase,
});
