import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

/**
 * A forum actor corresponding to a regular user.
 */
export interface UserForumActor {
  type: ObjectType.UserForumActor;
  role?: ForumRole;
  user: UserRef;
}

export const $UserForumActor: RecordIoType<UserForumActor> = new RecordType<UserForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.UserForumActor})},
    role: {type: $ForumRole, optional: true},
    user: {type: $UserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
