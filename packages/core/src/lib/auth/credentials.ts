import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Password, Password } from "../password/password.js";
import { $RawLogin, RawLogin } from "./raw-login";

export interface Credentials {
  login: RawLogin;

  /**
   * Password for the Eternal-Twin user or client.
   */
  password: Password;
}

export const $Credentials: RecordIoType<Credentials> = new RecordType<Credentials>({
  properties: {
    login: {type: $RawLogin},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
