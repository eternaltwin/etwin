import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

/**
 * A forum actor corresponding to a an anonymous role.
 *
 * Administrators and other moderators can see the real user behind the action.
 */
export interface RoleForumActor {
  type: ObjectType.RoleForumActor;
  role: ForumRole;
  user?: UserRef;
}

export const $RoleForumActor: RecordIoType<RoleForumActor> = new RecordType<RoleForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.RoleForumActor})},
    role: {type: $ForumRole},
    user: {type: $UserRef, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
