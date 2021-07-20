import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumPost, HammerfestForumPost } from "./hammerfest-forum-post.js";

export interface HammerfestForumPostListing {
  page1: number;
  pages: number;
  items: HammerfestForumPost[];
}

export const $HammerfestForumPostListing: RecordIoType<HammerfestForumPostListing> = new RecordType<HammerfestForumPostListing>({
  properties: {
    page1: {type: $Uint32},
    pages: {type: $Uint32},
    items: {type: new ArrayType({itemType: $HammerfestForumPost, maxLength: 15})},
  },
  changeCase: CaseStyle.SnakeCase,
});
