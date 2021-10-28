import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableForumPostRevisionComment, NullableForumPostRevisionComment } from "./forum-post-revision-comment.mjs";
import { $ForumPostRevisionId, ForumPostRevisionId } from "./forum-post-revision-id.mjs";

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
