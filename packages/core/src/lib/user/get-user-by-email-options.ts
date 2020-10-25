import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";

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
