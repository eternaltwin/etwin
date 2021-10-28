import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $ForumRole, ForumRole } from "./forum-role.mjs";

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
