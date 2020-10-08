import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HtmlText, HtmlText } from "../core/html-text.js";
import { $HammerfestForumDate, HammerfestForumDate } from "./hammerfest-forum-date.js";
import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.js";
import { $HammerfestUserRef, HammerfestUserRef } from "./hammerfest-user-ref.js";

/**
 * A forum message.
 */
export interface HammerfestForumPost {
  id?: HammerfestForumThreadId;
  author: HammerfestUserRef;
  ctime: HammerfestForumDate;
  content: HtmlText;
}

export const $HammerfestForumPost: RecordIoType<HammerfestForumPost> = new RecordType<HammerfestForumPost>({
  properties: {
    id: {type: $HammerfestForumThreadId, optional: true},
    author: {type: $HammerfestUserRef},
    ctime: {type: $HammerfestForumDate},
    content: {type: $HtmlText},
  },
  changeCase: CaseStyle.SnakeCase,
});
