import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumSectionMeta, ForumSectionMeta } from "./forum-section-meta.js";

export interface ForumSectionListing {
  items: ForumSectionMeta[];
}

export const $ForumSectionListing: RecordIoType<ForumSectionListing> = new RecordType<ForumSectionListing>({
  properties: {
    items: {type: new ArrayType({itemType: $ForumSectionMeta, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
