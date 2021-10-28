import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ListingCount, ListingCount } from "../core/listing-count.mjs";
import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ForumThreadId, ForumThreadId } from "./forum-thread-id.mjs";
import { $NullableForumThreadKey, NullableForumThreadKey } from "./forum-thread-key.mjs";
import { $ForumThreadTitle, ForumThreadTitle } from "./forum-thread-title.mjs";

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
