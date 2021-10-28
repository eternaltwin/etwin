import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $ForumRole, ForumRole } from "./forum-role.mjs";

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
