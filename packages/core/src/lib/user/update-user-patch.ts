import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $NullablePassword, NullablePassword } from "../password/password.js";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";
import { $NullableUsername, NullableUsername } from "./username.js";

export interface UpdateUserPatch {
  displayName?: UserDisplayName;
  username?: NullableUsername;
  password?: NullablePassword;
}

export const $UpdateUserPatch: RecordIoType<UpdateUserPatch> = new RecordType<UpdateUserPatch>({
  properties: {
    displayName: {type: $UserDisplayName, optional: true},
    username: {type: $NullableUsername, optional: true},
    password: {type: $NullablePassword, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
