import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $HammerfestForumThemeId, HammerfestForumThemeId } from "./hammerfest-forum-theme-id.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";

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
