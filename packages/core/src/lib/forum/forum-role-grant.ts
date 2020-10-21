import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

export interface ForumRoleGrant {
  role: ForumRole;
  user: ShortUser;
  startTime: Date;
  grantedBy: ShortUser;
}

export const $ForumRoleGrant: RecordIoType<ForumRoleGrant> = new RecordType<ForumRoleGrant>({
  properties: {
    role: {type: $ForumRole},
    user: {type: $ShortUser},
    startTime: {type: $Date},
    grantedBy: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
