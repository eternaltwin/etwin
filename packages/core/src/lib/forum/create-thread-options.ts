import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $MarktwinText, MarktwinText } from "../core/marktwin-text.js";
import { $ForumThreadTitle, ForumThreadTitle } from "./forum-thread-title.js";

export interface CreateThreadOptions {
  title: ForumThreadTitle;
  body: MarktwinText;
}

export const $CreateThreadOptions: RecordIoType<CreateThreadOptions> = new RecordType<CreateThreadOptions>({
  properties: {
    title: {type: $ForumThreadTitle},
    body: {type: $MarktwinText},
  },
  changeCase: CaseStyle.SnakeCase,
});
