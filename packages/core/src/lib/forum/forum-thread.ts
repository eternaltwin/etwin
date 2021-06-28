import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumPostListing, ForumPostListing } from "./forum-post-listing.js";
import { $ForumSectionMeta, ForumSectionMeta } from "./forum-section-meta.js";
import { $ForumThreadId, ForumThreadId } from "./forum-thread-id.js";
import { $NullableForumThreadKey, NullableForumThreadKey } from "./forum-thread-key.js";
import { $ForumThreadTitle, ForumThreadTitle } from "./forum-thread-title.js";

export interface ForumThread {
  type: ObjectType.ForumThread;
  id: ForumThreadId;
  key: NullableForumThreadKey;
  title: ForumThreadTitle;
  ctime: Date;
  section: ForumSectionMeta;
  posts: ForumPostListing;
  isPinned: boolean;
  isLocked: boolean;
}

export const $ForumThread: RecordIoType<ForumThread> = new RecordType<ForumThread>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumThread})},
    id: {type: $ForumThreadId},
    key: {type: $NullableForumThreadKey},
    title: {type: $ForumThreadTitle},
    ctime: {type: $Date},
    section: {type: $ForumSectionMeta},
    posts: {type: $ForumPostListing},
    isPinned: {type: $Boolean},
    isLocked: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
