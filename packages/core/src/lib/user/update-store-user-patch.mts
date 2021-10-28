import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullablePasswordHash, NullablePasswordHash } from "../password/password-hash.mjs";
import { $UserDisplayName, UserDisplayName } from "./user-display-name.mjs";
import { $NullableUsername, NullableUsername } from "./username.mjs";

export interface UpdateStoreUserPatch {
  displayName?: UserDisplayName;
  username?: NullableUsername;
  password?: NullablePasswordHash;
}

export const $UpdateStoreUserPatch: RecordIoType<UpdateStoreUserPatch> = new RecordType<UpdateStoreUserPatch>({
  properties: {
    displayName: {type: $UserDisplayName, optional: true},
    username: {type: $NullableUsername, optional: true},
    password: {type: $NullablePasswordHash, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
