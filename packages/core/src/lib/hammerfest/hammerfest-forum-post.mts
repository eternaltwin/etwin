import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HtmlText, HtmlText } from "../core/html-text.mjs";
import { $HammerfestForumDate, HammerfestForumDate } from "./hammerfest-forum-date.mjs";
import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.mjs";

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
