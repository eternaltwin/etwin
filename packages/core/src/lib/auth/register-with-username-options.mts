import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Password, Password } from "../password/password.mjs";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.mjs";
import { $Username, Username } from "../user/username.mjs";

export interface RegisterWithUsernameOptions {
  username: Username;

  displayName: UserDisplayName;

  password: Password;
}

export const $RegisterWithUsernameOptions: RecordIoType<RegisterWithUsernameOptions> = new RecordType<RegisterWithUsernameOptions>({
  properties: {
    username: {type: $Username},
    displayName: {type: $UserDisplayName},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
