import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserId, UserId } from "../user/user-id.js";
import { $LoginType, LoginType } from "./login-type.js";

export interface UserIdLogin {
  type: LoginType.UserId;

  value: UserId;
}

export const $UserIdLogin: RecordIoType<UserIdLogin> = new RecordType<UserIdLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.UserId})},
    value: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
