import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $MarktwinText, MarktwinText } from "../core/marktwin-text.mjs";

export interface CreatePostOptions {
  body: MarktwinText;
}

export const $CreatePostOptions: RecordIoType<CreatePostOptions> = new RecordType<CreatePostOptions>({
  properties: {
    body: {type: $MarktwinText},
  },
  changeCase: CaseStyle.SnakeCase,
});
