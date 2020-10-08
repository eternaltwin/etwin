import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";

/**
 * A forum thread as found in a theme page.
 */
export interface HammerfestForumThreadRef {
  server: HammerfestServer;
  id: HammerfestForumThreadId;
  name: string;
}

export const $HammerfestForumThreadRef: RecordIoType<HammerfestForumThreadRef> = new RecordType<HammerfestForumThreadRef>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestForumThreadId},
    name: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
