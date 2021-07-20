import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $ForumPostRevision, ForumPostRevision } from "./forum-post-revision.js";

export interface ShortForumPostRevisionListing {
  count: number;
  last: ForumPostRevision;
}

export const $ShortForumPostRevisionListing: RecordIoType<ShortForumPostRevisionListing> = new RecordType<ShortForumPostRevisionListing>({
  properties: {
    count: {type: $Uint32},
    last: {type: $ForumPostRevision},
  },
  changeCase: CaseStyle.SnakeCase,
});
