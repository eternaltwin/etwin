import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ForumPostListing, ForumPostListing } from "./forum-post-listing.mjs";
import { $ForumSectionMeta, ForumSectionMeta } from "./forum-section-meta.mjs";
import { $ForumThreadId, ForumThreadId } from "./forum-thread-id.mjs";
import { $NullableForumThreadKey, NullableForumThreadKey } from "./forum-thread-key.mjs";
import { $ForumThreadTitle, ForumThreadTitle } from "./forum-thread-title.mjs";

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
