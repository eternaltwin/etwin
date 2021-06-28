import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $Url, Url } from "./url.js";

export interface UrlRef {
  url: Url;
}

export const $UrlRef: RecordIoType<UrlRef> = new RecordType<UrlRef>({
  properties: {
    url: {type: $Url},
  },
  changeCase: CaseStyle.SnakeCase,
});
