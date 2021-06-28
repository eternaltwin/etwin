import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $NullableForumPostRevisionComment, NullableForumPostRevisionComment } from "./forum-post-revision-comment.js";
import { $ForumPostRevisionId, ForumPostRevisionId } from "./forum-post-revision-id.js";

export interface DeletePostOptions {
  lastRevisionId: ForumPostRevisionId;
  comment: NullableForumPostRevisionComment;
}

export const $DeletePostOptions: RecordIoType<DeletePostOptions> = new RecordType<DeletePostOptions>({
  properties: {
    lastRevisionId: {type: $ForumPostRevisionId},
    comment: {type: $NullableForumPostRevisionComment},
  },
  changeCase: CaseStyle.SnakeCase,
});
