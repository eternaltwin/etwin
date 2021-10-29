import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $ForumRole, ForumRole } from "./forum-role.mjs";

export interface ForumRoleRevocation {
  role: ForumRole;
  user: ShortUser;
  startTime: Date;
  endTime: Date;
  grantedBy: ShortUser;
  revokedBy: ShortUser;
}

export const $ForumRoleRevocation: RecordIoType<ForumRoleRevocation> = new RecordType<ForumRoleRevocation>({
  properties: {
    role: {type: $ForumRole},
    user: {type: $ShortUser},
    startTime: {type: $Date},
    endTime: {type: $Date},
    grantedBy: {type: $ShortUser},
    revokedBy: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
