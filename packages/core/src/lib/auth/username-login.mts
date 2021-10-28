import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $Username, Username } from "../user/username.mjs";
import { $LoginType, LoginType } from "./login-type.mjs";

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
