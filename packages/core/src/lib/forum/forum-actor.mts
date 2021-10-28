import { TaggedUnionType } from "kryo/tagged-union";

import { $ClientForumActor, ClientForumActor } from "./client-forum-actor.mjs";
import { $RoleForumActor, RoleForumActor } from "./role-forum-actor.mjs";
import { $UserForumActor, UserForumActor } from "./user-forum-actor.mjs";

export type ForumActor =
  ClientForumActor
  | RoleForumActor
  | UserForumActor;

export const $ForumActor: TaggedUnionType<ForumActor> = new TaggedUnionType<ForumActor>({
  variants: [$ClientForumActor, $RoleForumActor, $UserForumActor],
  tag: "type",
});
