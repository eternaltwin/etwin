import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRole, ForumRole } from "./forum-role.js";

export interface ForumRoleActor {
  type: ObjectType.ForumRole;
  role: ForumRole;
  /**
   * Only administrators and other moderators can see the actual user behind the role.
   */
  user?: UserRef;
}

export const $ForumRoleActor: RecordIoType<ForumRoleActor> = new RecordType<ForumRoleActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumRole})},
    role: {type: $ForumRole},
    user: {type: $UserRef, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
