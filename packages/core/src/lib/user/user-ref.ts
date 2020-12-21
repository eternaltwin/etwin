import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $UserId, UserId } from "./user-id.js";
import { $Username, Username } from "./username.js";

export interface UserRef {
  id?: UserId;
  username?: Username;
  email?: EmailAddress;
}

export const $UserRef: RecordIoType<UserRef> = new RecordType<UserRef>({
  properties: {
    id: {type: $UserId, optional: true},
    username: {type: $Username, optional: true},
    email: {type: $EmailAddress, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
