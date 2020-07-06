import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumRole, ForumRole } from "./forum-role.js";

export interface ForumSectionSelf {
  roles: ForumRole[];
}

export const $ForumSectionSelf: RecordIoType<ForumSectionSelf> = new RecordType<ForumSectionSelf>({
  properties: {
    roles: {type: new ArrayType({itemType: $ForumRole, maxLength: 10})},
  },
  changeCase: CaseStyle.SnakeCase,
});
