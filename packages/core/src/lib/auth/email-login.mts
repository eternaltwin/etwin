import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";
import { $LoginType, LoginType } from "./login-type.mjs";

export interface EmailLogin {
  type: LoginType.Email;

  value: EmailAddress;
}

export const $EmailLogin: RecordIoType<EmailLogin> = new RecordType<EmailLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.Email})},
    value: {type: $EmailAddress},
  },
  changeCase: CaseStyle.SnakeCase,
});
