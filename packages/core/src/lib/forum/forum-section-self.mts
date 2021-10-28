import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $ForumRole, ForumRole } from "./forum-role.mjs";

export interface ForumSectionSelf {
  roles: ForumRole[];
}

export const $ForumSectionSelf: RecordIoType<ForumSectionSelf> = new RecordType<ForumSectionSelf>({
  properties: {
    roles: {type: new ArrayType({itemType: $ForumRole, maxLength: 10})},
  },
  changeCase: CaseStyle.SnakeCase,
});
