import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumPostAuthor, ForumPostAuthor } from "./forum-post-author.js";
import { $NullableForumPostRevisionComment, NullableForumPostRevisionComment } from "./forum-post-revision-comment.js";
import { $NullableForumPostRevisionContent, NullableForumPostRevisionContent } from "./forum-post-revision-content.js";
import { $ForumPostRevisionId, ForumPostRevisionId } from "./forum-post-revision-id.js";

export interface ForumPostRevision {
  type: ObjectType.ForumPostRevision;
  id: ForumPostRevisionId;
  time: Date;
  author: ForumPostAuthor;
  content: NullableForumPostRevisionContent;
  moderation: NullableForumPostRevisionContent;
  comment: NullableForumPostRevisionComment;
}

export const $ForumPostRevision: RecordIoType<ForumPostRevision> = new RecordType<ForumPostRevision>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumPostRevision})},
    id: {type: $ForumPostRevisionId},
    time: {type: $Date},
    author: {type: $ForumPostAuthor},
    content: {type: $NullableForumPostRevisionContent},
    moderation: {type: $NullableForumPostRevisionContent},
    comment: {type: $NullableForumPostRevisionComment},
  },
  changeCase: CaseStyle.SnakeCase,
});
