import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";
import { $UserId, UserId } from "./user-id.mjs";
import { $Username, Username } from "./username.mjs";

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
