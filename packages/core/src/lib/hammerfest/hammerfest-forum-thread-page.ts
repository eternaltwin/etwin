import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestForumPostListing, HammerfestForumPostListing } from "./hammerfest-forum-post-listing.js";
import { $HammerfestForumThemeRef, HammerfestForumThemeRef } from "./hammerfest-forum-theme-ref.js";
import { $HammerfestForumThreadRef, HammerfestForumThreadRef } from "./hammerfest-forum-thread-ref.js";

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
