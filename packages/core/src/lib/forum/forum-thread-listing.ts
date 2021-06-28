import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { $Uint32 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ForumThreadMeta, ForumThreadMeta } from "./forum-thread-meta.js";

export interface ForumThreadListing {
  offset: number;
  limit: number;
  count: number;
  items: ForumThreadMeta[];
}

export const $ForumThreadListing: RecordIoType<ForumThreadListing> = new RecordType<ForumThreadListing>({
  properties: {
    offset: {type: $Uint32},
    limit: {type: $Uint32},
    count: {type: $Uint32},
    items: {type: new ArrayType({itemType: $ForumThreadMeta, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
