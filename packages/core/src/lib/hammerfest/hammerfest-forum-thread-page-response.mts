import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestForumThreadPage, HammerfestForumThreadPage } from "./hammerfest-forum-thread-page.mjs";
import {
  $NullableHammerfestSessionUser,
  NullableHammerfestSessionUser
} from "./hammerfest-session-user.mjs";

export interface HammerfestForumThreadPageResponse {
  session: NullableHammerfestSessionUser;
  page: HammerfestForumThreadPage;
}

export const $HammerfestForumThreadPageResponse: RecordIoType<HammerfestForumThreadPageResponse> = new RecordType<HammerfestForumThreadPageResponse>({
  properties: {
    session: {type: $NullableHammerfestSessionUser},
    page: {type: $HammerfestForumThreadPage},
  },
  changeCase: CaseStyle.SnakeCase,
});
