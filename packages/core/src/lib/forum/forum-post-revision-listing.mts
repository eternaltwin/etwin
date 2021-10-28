import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $ForumPostRevision, ForumPostRevision } from "./forum-post-revision.mjs";

export interface ForumPostRevisionListing {
  offset: number;
  limit: number;
  count: number;
  items: ForumPostRevision[];
}

export const $ForumPostRevisionListing: RecordIoType<ForumPostRevisionListing> = new RecordType<ForumPostRevisionListing>({
  properties: {
    offset: {type: $Uint32},
    limit: {type: $Uint32},
    count: {type: $Uint32},
    items: {type: new ArrayType({itemType: $ForumPostRevision, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
