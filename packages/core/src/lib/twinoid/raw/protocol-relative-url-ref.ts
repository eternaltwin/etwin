import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ProtocolRelativeUrl, ProtocolRelativeUrl } from "./protocol-relative-url.js";

export interface ProtocolRelativeUrlRef {
  url: ProtocolRelativeUrl;
}

export const $ProtocolRelativeUrlRef: RecordIoType<ProtocolRelativeUrlRef> = new RecordType<ProtocolRelativeUrlRef>({
  properties: {
    url: {type: $ProtocolRelativeUrl},
  },
  changeCase: CaseStyle.SnakeCase,
});
