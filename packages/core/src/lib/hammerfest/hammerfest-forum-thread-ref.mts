import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $HammerfestForumThreadId, HammerfestForumThreadId } from "./hammerfest-forum-thread-id.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";

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
