import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $LocaleId, LocaleId } from "../core/locale-id.mjs";
import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $ForumRoleGrant, ForumRoleGrant } from "./forum-role-grant.mjs";
import { $ForumSectionDisplayName, ForumSectionDisplayName } from "./forum-section-display-name.mjs";
import { $ForumSectionId, ForumSectionId } from "./forum-section-id.mjs";
import { $NullableForumSectionKey, NullableForumSectionKey } from "./forum-section-key.mjs";
import { $ForumSectionSelf, ForumSectionSelf } from "./forum-section-self.mjs";
import { $ForumThreadListing, ForumThreadListing } from "./forum-thread-listing.mjs";

export interface ForumSection {
  type: ObjectType.ForumSection;
  id: ForumSectionId;
  key: NullableForumSectionKey;
  displayName: ForumSectionDisplayName;
  ctime: Date;
  locale: LocaleId | null;
  threads: ForumThreadListing;
  roleGrants: ForumRoleGrant[];
  self: ForumSectionSelf;
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
    self: {type: $ForumSectionSelf},
  },
  changeCase: CaseStyle.SnakeCase,
});
