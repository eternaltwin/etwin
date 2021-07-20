import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ListingCount, ListingCount } from "../core/listing-count.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumThreadId, ForumThreadId } from "./forum-thread-id.js";
import { $NullableForumThreadKey, NullableForumThreadKey } from "./forum-thread-key.js";
import { $ForumThreadTitle, ForumThreadTitle } from "./forum-thread-title.js";

export interface ForumThreadMeta {
  type: ObjectType.ForumThread;
  id: ForumThreadId;
  key: NullableForumThreadKey;
  title: ForumThreadTitle;
  ctime: Date;
  isPinned: boolean;
  isLocked: boolean;
  posts: ListingCount;
}

export const $ForumThreadMeta: RecordIoType<ForumThreadMeta> = new RecordType<ForumThreadMeta>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumThread})},
    id: {type: $ForumThreadId},
    key: {type: $NullableForumThreadKey},
    title: {type: $ForumThreadTitle},
    ctime: {type: $Date},
    isPinned: {type: $Boolean},
    isLocked: {type: $Boolean},
    posts: {type: $ListingCount},
  },
  changeCase: CaseStyle.SnakeCase,
});
