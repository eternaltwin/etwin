import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumThemeRef, HammerfestForumThemeRef } from "./hammerfest-forum-theme-ref.mjs";
import { $HammerfestForumThread, HammerfestForumThread } from "./hammerfest-forum-thread.mjs";
import { $HammerfestForumThreadListing, HammerfestForumThreadListing } from "./hammerfest-forum-thread-listing.mjs";

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
