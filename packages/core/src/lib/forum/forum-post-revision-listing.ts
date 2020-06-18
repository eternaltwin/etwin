import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumPostRevision, ForumPostRevision } from "./forum-post-revision.js";

export interface ForumPostRevisionListing {
  count: number;
  latest: ForumPostRevision;
}

export const $ForumPostRevisionListing: RecordIoType<ForumPostRevisionListing> = new RecordType<ForumPostRevisionListing>({
  properties: {
    count: {type: $Uint32},
    latest: {type: $ForumPostRevision},
  },
  changeCase: CaseStyle.SnakeCase,
});
