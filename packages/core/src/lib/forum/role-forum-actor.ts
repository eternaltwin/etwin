import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

/**
 * A forum actor corresponding to a an anonymous role.
 *
 * Administrators and other moderators can see the real user behind the action.
 */
export interface RoleForumActor {
  type: ObjectType.RoleForumActor;
  role: ForumRole;
  user?: ShortUser;
}

export const $RoleForumActor: RecordIoType<RoleForumActor> = new RecordType<RoleForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.RoleForumActor})},
    role: {type: $ForumRole},
    user: {type: $ShortUser, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
