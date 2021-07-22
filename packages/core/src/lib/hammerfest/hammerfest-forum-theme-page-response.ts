import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumThemePage, HammerfestForumThemePage } from "./hammerfest-forum-theme-page.js";
import {
  $NullableHammerfestSessionUser,
  NullableHammerfestSessionUser
} from "./hammerfest-session-user.js";

export interface HammerfestForumThemePageResponse {
  session: NullableHammerfestSessionUser;
  page: HammerfestForumThemePage;
}

export const $HammerfestForumThemePageResponse: RecordIoType<HammerfestForumThemePageResponse> = new RecordType<HammerfestForumThemePageResponse>({
  properties: {
    session: {type: $NullableHammerfestSessionUser},
    page: {type: $HammerfestForumThemePage},
  },
  changeCase: CaseStyle.SnakeCase,
});
