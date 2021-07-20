import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Password, Password } from "../password/password.js";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.js";
import { $Username, Username } from "../user/username.js";

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
