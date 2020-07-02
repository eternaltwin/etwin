import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { $Date } from "kryo/lib/date.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $LocaleId, LocaleId } from "../core/locale-id.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumRoleGrant, ForumRoleGrant } from "./forum-role-grant.js";
import { $ForumSectionDisplayName, ForumSectionDisplayName } from "./forum-section-display-name.js";
import { $ForumSectionId, ForumSectionId } from "./forum-section-id.js";
import { $NullableForumSectionKey, NullableForumSectionKey } from "./forum-section-key.js";
import { $ForumThreadListing, ForumThreadListing } from "./forum-thread-listing.js";

export interface ForumSection {
  type: ObjectType.ForumSection;
  id: ForumSectionId;
  key: NullableForumSectionKey;
  displayName: ForumSectionDisplayName;
  ctime: Date;
  locale: LocaleId | null;
  threads: ForumThreadListing;
  roleGrants: ForumRoleGrant[];
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
    roleGrants: {type: new ArrayType({itemType: $ForumRoleGrant, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
