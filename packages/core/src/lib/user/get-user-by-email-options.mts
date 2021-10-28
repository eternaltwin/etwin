import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";

export interface GetUserByEmailOptions {
  email: EmailAddress;
  time?: Date;
}

export const $GetUserByEmailOptions: RecordIoType<GetUserByEmailOptions> = new RecordType<GetUserByEmailOptions>({
  properties: {
    email: {type: $EmailAddress},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
