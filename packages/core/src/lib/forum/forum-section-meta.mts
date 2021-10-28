import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ListingCount, ListingCount } from "../core/listing-count.mjs";
import { $LocaleId, LocaleId } from "../core/locale-id.mjs";
import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ForumSectionDisplayName, ForumSectionDisplayName } from "./forum-section-display-name.mjs";
import { $ForumSectionId, ForumSectionId } from "./forum-section-id.mjs";
import { $NullableForumSectionKey, NullableForumSectionKey } from "./forum-section-key.mjs";
import { $ForumSectionSelf, ForumSectionSelf } from "./forum-section-self.mjs";

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
