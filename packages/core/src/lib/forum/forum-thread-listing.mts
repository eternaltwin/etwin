import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $ForumThreadMeta, ForumThreadMeta } from "./forum-thread-meta.mjs";

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
