import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Password, Password } from "../password/password.js";
import { $RawUserLogin, RawUserLogin } from "./raw-user-login.js";

/**
 * Credentials with a raw (non-resolved) login.
 * See `Credentials` for the resolved variant.
 */
export interface RawUserCredentials {
  login: RawUserLogin;
  password: Password;
}

export const $RawUserCredentials: RecordIoType<RawUserCredentials> = new RecordType<RawUserCredentials>({
  properties: {
    login: {type: $RawUserLogin},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
