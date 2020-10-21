import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

/**
 * A forum actor corresponding to a regular user.
 */
export interface UserForumActor {
  type: ObjectType.UserForumActor;
  role?: ForumRole;
  user: ShortUser;
}

export const $UserForumActor: RecordIoType<UserForumActor> = new RecordType<UserForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.UserForumActor})},
    role: {type: $ForumRole, optional: true},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
