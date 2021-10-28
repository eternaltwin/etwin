import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumTheme, HammerfestForumTheme } from "./hammerfest-forum-theme.mjs";
import {
  $NullableHammerfestSessionUser,
  NullableHammerfestSessionUser
} from "./hammerfest-session-user.mjs";

export interface HammerfestForumHomeResponse {
  session: NullableHammerfestSessionUser;
  themes: HammerfestForumTheme[];
}

export const $HammerfestForumHomeResponse: RecordIoType<HammerfestForumHomeResponse> = new RecordType<HammerfestForumHomeResponse>({
  properties: {
    session: {type: $NullableHammerfestSessionUser},
    themes: {type: new ArrayType({itemType: $HammerfestForumTheme, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
