import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumActor, ForumActor } from "./forum-actor.js";
import { $ForumPostId, ForumPostId } from "./forum-post-id.js";
import { $ForumPostRevisionListing, ForumPostRevisionListing } from "./forum-post-revision-listing.js";
import { $ForumThreadMetaWithSection, ForumThreadMetaWithSection } from "./forum-thread-meta-with-section.js";

export interface ForumPost {
  type: ObjectType.ForumPost;
  id: ForumPostId;
  ctime: Date;
  author: ForumActor;
  revisions: ForumPostRevisionListing;
  thread: ForumThreadMetaWithSection;
}

export const $ForumPost: RecordIoType<ForumPost> = new RecordType<ForumPost>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumPost})},
    id: {type: $ForumPostId},
    ctime: {type: $Date},
    author: {type: $ForumActor},
    revisions: {type: $ForumPostRevisionListing},
    thread: {type: $ForumThreadMetaWithSection},
  },
  changeCase: CaseStyle.SnakeCase,
});
