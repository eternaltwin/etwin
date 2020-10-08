import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestForumThemeId, HammerfestForumThemeId } from "./hammerfest-forum-theme-id.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";

/**
 * Forum theme reference.
 */
export interface HammerfestForumThemeRef {
  server: HammerfestServer;
  id: HammerfestForumThemeId;
  name: string;
}

export const $HammerfestForumThemeRef: RecordIoType<HammerfestForumThemeRef> = new RecordType<HammerfestForumThemeRef>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestForumThemeId},
    name: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
