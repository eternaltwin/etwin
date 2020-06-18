import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $ForumRoleActor, ForumRoleActor } from "./forum-role-actor.js";

export type ForumPostAuthor =
  UserRef
  | ForumRoleActor;

export const $ForumPostAuthor: TaggedUnionType<ForumPostAuthor> = new TaggedUnionType<ForumPostAuthor>({
  variants: [$UserRef, $ForumRoleActor],
  tag: "type",
});
