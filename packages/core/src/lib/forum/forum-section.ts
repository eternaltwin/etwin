import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $LocaleId, LocaleId } from "../core/locale-id";
import { $ObjectType, ObjectType } from "../core/object-type";
import { $ForumSectionDisplayName, ForumSectionDisplayName } from "./forum-section-display-name.js";
import { $ForumSectionId, ForumSectionId } from "./forum-section-id.js";
import { $NullableForumSectionKey, NullableForumSectionKey } from "./forum-section-key";
import { $ForumThreadListing, ForumThreadListing } from "./forum-thread-listing";

export interface ForumSection {
  type: ObjectType.ForumSection;
  id: ForumSectionId;
  key: NullableForumSectionKey;
  displayName: ForumSectionDisplayName;
  ctime: Date;
  locale: LocaleId | null;
  threads: ForumThreadListing;
}

export const $ForumSection: RecordIoType<ForumSection> = new RecordType<ForumSection>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ForumSection})},
    id: {type: $ForumSectionId},
    key: {type: $NullableForumSectionKey},
    displayName: {type: $ForumSectionDisplayName},
    ctime: {type: $Date},
    locale: {type: $LocaleId},
    threads: {type: $ForumThreadListing},
  },
  changeCase: CaseStyle.SnakeCase,
});
