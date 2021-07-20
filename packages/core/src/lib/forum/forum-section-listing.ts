import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

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
