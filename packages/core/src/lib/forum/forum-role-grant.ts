import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

export interface ForumRoleGrant {
  role: ForumRole;
  user: UserRef;
  startTime: Date;
  grantedBy: UserRef;
}

export const $ForumRoleGrant: RecordIoType<ForumRoleGrant> = new RecordType<ForumRoleGrant>({
  properties: {
    role: {type: $ForumRole},
    user: {type: $UserRef},
    startTime: {type: $Date},
    grantedBy: {type: $UserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
