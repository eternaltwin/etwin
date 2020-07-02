import { TaggedUnionType } from "kryo/lib/tagged-union.js";

import { $ClientForumActor, ClientForumActor } from "./client-forum-actor.js";
import { $RoleForumActor, RoleForumActor } from "./role-forum-actor.js";
import { $UserForumActor, UserForumActor } from "./user-forum-actor.js";

export type ForumActor =
  ClientForumActor
  | RoleForumActor
  | UserForumActor;

export const $ForumActor: TaggedUnionType<ForumActor> = new TaggedUnionType<ForumActor>({
  variants: [$ClientForumActor, $RoleForumActor, $UserForumActor],
  tag: "type",
});
