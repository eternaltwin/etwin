import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $HammerfestForumDate, HammerfestForumDate } from "./hammerfest-forum-date.mjs";
import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.mjs";

/**
 * A forum thread as found in a theme page.
 */
export interface HammerfestForumThread {
  server: HammerfestServer;
  id: HammerfestForumThreadId;
  name: string;
  author: ShortHammerfestUser;
  lastMessageDate: HammerfestForumDate;
  replyCount: number;
  isSticky: boolean;
  isClosed: boolean;
}

export const $HammerfestForumThread: RecordIoType<HammerfestForumThread> = new RecordType<HammerfestForumThread>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestForumThreadId},
    name: {type: $Ucs2String},
    author: {type: $ShortHammerfestUser},
    lastMessageDate: {type: $HammerfestForumDate},
    replyCount: {type: $Uint32},
    isSticky: {type: $Boolean},
    isClosed: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
