import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $MarktwinText, MarktwinText } from "../core/marktwin-text.js";

export interface CreatePostOptions {
  body: MarktwinText;
}

export const $CreatePostOptions: RecordIoType<CreatePostOptions> = new RecordType<CreatePostOptions>({
  properties: {
    body: {type: $MarktwinText},
  },
  changeCase: CaseStyle.SnakeCase,
});
