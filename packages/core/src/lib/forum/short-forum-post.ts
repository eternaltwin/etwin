import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumPostAuthor, ForumPostAuthor } from "./forum-post-author.js";
import { $ForumPostId, ForumPostId } from "./forum-post-id.js";
import { $ForumPostRevisionListing, ForumPostRevisionListing } from "./forum-post-revision-listing.js";

export interface ShortForumPost {
  type: ObjectType.ForumPost;
  id: ForumPostId;
  ctime: Date;
  author: ForumPostAuthor;
  revisions: ForumPostRevisionListing;
}

export const $ShortForumPost: RecordIoType<ShortForumPost> = new RecordType<ShortForumPost>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumPost})},
    id: {type: $ForumPostId},
    ctime: {type: $Date},
    author: {type: $ForumPostAuthor},
    revisions: {type: $ForumPostRevisionListing},
  },
  changeCase: CaseStyle.SnakeCase,
});
