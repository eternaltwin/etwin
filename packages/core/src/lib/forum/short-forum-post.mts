import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ForumActor, ForumActor } from "./forum-actor.mjs";
import { $ForumPostId, ForumPostId } from "./forum-post-id.mjs";
import { $ShortForumPostRevisionListing, ShortForumPostRevisionListing } from "./short-forum-post-revision-listing.mjs";

export interface ShortForumPost {
  type: ObjectType.ForumPost;
  id: ForumPostId;
  ctime: Date;
  author: ForumActor;
  revisions: ShortForumPostRevisionListing;
}

export const $ShortForumPost: RecordIoType<ShortForumPost> = new RecordType<ShortForumPost>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumPost})},
    id: {type: $ForumPostId},
    ctime: {type: $Date},
    author: {type: $ForumActor},
    revisions: {type: $ShortForumPostRevisionListing},
  },
  changeCase: CaseStyle.SnakeCase,
});
