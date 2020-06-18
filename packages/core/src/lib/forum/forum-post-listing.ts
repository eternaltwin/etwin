import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { $Uint32 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumPost, ForumPost } from "./forum-post.js";

export interface ForumPostListing {
  offset: number;
  limit: number;
  count: number;
  items: ForumPost[];
}

export const $ForumPostListing: RecordIoType<ForumPostListing> = new RecordType<ForumPostListing>({
  properties: {
    offset: {type: $Uint32},
    limit: {type: $Uint32},
    count: {type: $Uint32},
    items: {type: new ArrayType({itemType: $ForumPost, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
