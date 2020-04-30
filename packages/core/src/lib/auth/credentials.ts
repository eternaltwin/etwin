import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Password, Password } from "../password/password.js";
import { $Login, Login } from "./login.js";

export interface Credentials {
  /**
   * Email address or username.
   */
  login: Login;

  /**
   * Password for the Eternal-Twin user.
   */
  password: Password;
}

export const $Credentials: RecordIoType<Credentials> = new RecordType<Credentials>({
  properties: {
    login: {type: $Login},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
