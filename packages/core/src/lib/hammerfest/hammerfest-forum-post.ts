import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $HtmlText, HtmlText } from "../core/html-text.js";
import { $HammerfestForumDate, HammerfestForumDate } from "./hammerfest-forum-date.js";
import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.js";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.js";

/**
 * A forum message.
 */
export interface HammerfestForumPost {
  id?: HammerfestForumThreadId;
  author: ShortHammerfestUser;
  ctime: HammerfestForumDate;
  content: HtmlText;
}

export const $HammerfestForumPost: RecordIoType<HammerfestForumPost> = new RecordType<HammerfestForumPost>({
  properties: {
    id: {type: $HammerfestForumThreadId, optional: true},
    author: {type: $ShortHammerfestUser},
    ctime: {type: $HammerfestForumDate},
    content: {type: $HtmlText},
  },
  changeCase: CaseStyle.SnakeCase,
});
