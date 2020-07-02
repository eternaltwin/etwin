import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

export interface ForumRoleRevocation {
  role: ForumRole;
  user: UserRef;
  startTime: Date;
  endTime: Date;
  grantedBy: UserRef;
  revokedBy: UserRef;
}

export const $ForumRoleRevocation: RecordIoType<ForumRoleRevocation> = new RecordType<ForumRoleRevocation>({
  properties: {
    role: {type: $ForumRole},
    user: {type: $UserRef},
    startTime: {type: $Date},
    endTime: {type: $Date},
    grantedBy: {type: $UserRef},
    revokedBy: {type: $UserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
