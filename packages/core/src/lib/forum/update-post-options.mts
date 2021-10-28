import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableMarktwinText, NullableMarktwinText } from "../core/marktwin-text.mjs";
import { $NullableForumPostRevisionComment, NullableForumPostRevisionComment } from "./forum-post-revision-comment.mjs";
import { $ForumPostRevisionId, ForumPostRevisionId } from "./forum-post-revision-id.mjs";

export interface UpdatePostOptions {
  lastRevisionId: ForumPostRevisionId;
  content?: NullableMarktwinText;
  moderation?: NullableMarktwinText;
  comment: NullableForumPostRevisionComment;
}

export const $UpdatePostOptions: RecordIoType<UpdatePostOptions> = new RecordType<UpdatePostOptions>({
  properties: {
    lastRevisionId: {type: $ForumPostRevisionId},
    content: {type: $NullableMarktwinText, optional: true},
    moderation: {type: $NullableMarktwinText, optional: true},
    comment: {type: $NullableForumPostRevisionComment},
  },
  changeCase: CaseStyle.SnakeCase,
});
