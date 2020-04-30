import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Password, Password } from "../password/password.js";
import { $RawLogin, RawLogin } from "./raw-login";

/**
 * Credentials with a raw (non-resolved) login.
 * See `Credentials` for the resolved variant.
 */
export interface RawCredentials {
  login: RawLogin;
  password: Password;
}

export const $RawCredentials: RecordIoType<RawCredentials> = new RecordType<RawCredentials>({
  properties: {
    login: {type: $RawLogin},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
