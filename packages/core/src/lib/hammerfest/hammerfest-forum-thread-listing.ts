import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { $Uint32 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $HammerfestForumThread, HammerfestForumThread } from "./hammerfest-forum-thread.js";

export interface HammerfestForumThreadListing {
  page1: number;
  pages: number;
  items: HammerfestForumThread[];
}

export const $HammerfestForumThreadListing: RecordIoType<HammerfestForumThreadListing> = new RecordType<HammerfestForumThreadListing>({
  properties: {
    page1: {type: $Uint32},
    pages: {type: $Uint32},
    items: {type: new ArrayType({itemType: $HammerfestForumThread, maxLength: 15})},
  },
  changeCase: CaseStyle.SnakeCase,
});
