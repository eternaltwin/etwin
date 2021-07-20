import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $Username, Username } from "../user/username.js";
import { $LoginType, LoginType } from "./login-type.js";

export interface UsernameLogin {
  type: LoginType.Username;

  value: Username;
}

export const $UsernameLogin: RecordIoType<UsernameLogin> = new RecordType<UsernameLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.Username})},
    value: {type: $Username},
  },
  changeCase: CaseStyle.SnakeCase,
});
