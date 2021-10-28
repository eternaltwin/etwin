import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Password, Password } from "../password/password.mjs";
import { $RawUserLogin, RawUserLogin } from "./raw-user-login.mjs";

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
