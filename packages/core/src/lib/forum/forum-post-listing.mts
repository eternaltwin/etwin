import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortForumPost, ShortForumPost } from "./short-forum-post.mjs";

export interface ForumPostListing {
  offset: number;
  limit: number;
  count: number;
  items: ShortForumPost[];
}

export const $ForumPostListing: RecordIoType<ForumPostListing> = new RecordType<ForumPostListing>({
  properties: {
    offset: {type: $Uint32},
    limit: {type: $Uint32},
    count: {type: $Uint32},
    items: {type: new ArrayType({itemType: $ShortForumPost, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
