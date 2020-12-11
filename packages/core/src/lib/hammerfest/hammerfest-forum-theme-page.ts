import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestForumThemeRef, HammerfestForumThemeRef } from "./hammerfest-forum-theme-ref.js";
import { $HammerfestForumThread, HammerfestForumThread } from "./hammerfest-forum-thread.js";
import { $HammerfestForumThreadListing, HammerfestForumThreadListing } from "./hammerfest-forum-thread-listing.js";

export interface HammerfestForumThemePage {
  theme: HammerfestForumThemeRef;
  sticky: HammerfestForumThread[],
  threads: HammerfestForumThreadListing;
}

export const $HammerfestForumThemePage: RecordIoType<HammerfestForumThemePage> = new RecordType<HammerfestForumThemePage>({
  properties: {
    theme: {type: $HammerfestForumThemeRef},
    sticky: {type: new ArrayType({itemType: $HammerfestForumThread, maxLength: 15})},
    threads: {type: $HammerfestForumThreadListing},
  },
  changeCase: CaseStyle.SnakeCase,
});
