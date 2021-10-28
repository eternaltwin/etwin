import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Password, Password } from "../password/password.mjs";
import { $UserLogin, UserLogin } from "./user-login.mjs";

export interface UserCredentials {
  /**
   * Email address or username.
   */
  login: UserLogin;

  /**
   * Password for the Eternal-Twin user.
   */
  password: Password;
}

export const $UserCredentials: RecordIoType<UserCredentials> = new RecordType<UserCredentials>({
  properties: {
    login: {type: $UserLogin},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
