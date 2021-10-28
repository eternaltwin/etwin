import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumPostListing, HammerfestForumPostListing } from "./hammerfest-forum-post-listing.mjs";
import { $HammerfestForumThemeRef, HammerfestForumThemeRef } from "./hammerfest-forum-theme-ref.mjs";
import { $HammerfestForumThreadRef, HammerfestForumThreadRef } from "./hammerfest-forum-thread-ref.mjs";

export interface HammerfestForumThreadPage {
  theme: HammerfestForumThemeRef;
  thread: HammerfestForumThreadRef;
  messages: HammerfestForumPostListing;
}

export const $HammerfestForumThreadPage: RecordIoType<HammerfestForumThreadPage> = new RecordType<HammerfestForumThreadPage>({
  properties: {
    theme: {type: $HammerfestForumThemeRef},
    thread: {type: $HammerfestForumThreadRef},
    messages: {type: $HammerfestForumPostListing},
  },
  changeCase: CaseStyle.SnakeCase,
});
