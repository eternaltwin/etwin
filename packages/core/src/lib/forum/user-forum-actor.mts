import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $ForumRole, ForumRole } from "./forum-role.mjs";

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
