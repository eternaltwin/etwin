import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumActor, ForumActor } from "./forum-actor.js";
import { $ForumPostId, ForumPostId } from "./forum-post-id.js";
import { $ForumPostRevisionListing, ForumPostRevisionListing } from "./forum-post-revision-listing.js";
import { $ForumThreadMeta, ForumThreadMeta } from "./forum-thread-meta.js";

export interface ForumPost {
  type: ObjectType.ForumPost;
  id: ForumPostId;
  ctime: Date;
  author: ForumActor;
  revisions: ForumPostRevisionListing;
  thread: ForumThreadMeta;
}

export const $ForumPost: RecordIoType<ForumPost> = new RecordType<ForumPost>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumPost})},
    id: {type: $ForumPostId},
    ctime: {type: $Date},
    author: {type: $ForumActor},
    revisions: {type: $ForumPostRevisionListing},
    thread: {type: $ForumThreadMeta},
  },
  changeCase: CaseStyle.SnakeCase,
});
