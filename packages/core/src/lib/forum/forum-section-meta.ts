import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ListingCount, ListingCount } from "../core/listing-count.js";
import { $LocaleId, LocaleId } from "../core/locale-id.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumSectionDisplayName, ForumSectionDisplayName } from "./forum-section-display-name.js";
import { $ForumSectionId, ForumSectionId } from "./forum-section-id.js";
import { $NullableForumSectionKey, NullableForumSectionKey } from "./forum-section-key.js";
import { $ForumSectionSelf, ForumSectionSelf } from "./forum-section-self.js";

export interface ForumSectionMeta {
  type: ObjectType.ForumSection;
  id: ForumSectionId;
  key: NullableForumSectionKey;
  displayName: ForumSectionDisplayName;
  ctime: Date;
  locale: LocaleId | null;
  threads: ListingCount;
  self: ForumSectionSelf;
}

export const $ForumSectionMeta: RecordIoType<ForumSectionMeta> = new RecordType<ForumSectionMeta>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumSection})},
    id: {type: $ForumSectionId},
    key: {type: $NullableForumSectionKey},
    displayName: {type: $ForumSectionDisplayName},
    ctime: {type: $Date},
    locale: {type: $LocaleId},
    threads: {type: $ListingCount},
    self: {type: $ForumSectionSelf},
  },
  changeCase: CaseStyle.SnakeCase,
});
