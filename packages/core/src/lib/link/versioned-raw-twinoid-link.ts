import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OldRawTwinoidLink, OldRawTwinoidLink } from "./old-raw-twinoid-link.js";
import { $NullableRawTwinoidLink, NullableRawTwinoidLink } from "./raw-twinoid-link.js";

export interface VersionedRawTwinoidLink {
  current: NullableRawTwinoidLink;
  old: OldRawTwinoidLink[];
}

export const $VersionedRawTwinoidLink: RecordIoType<VersionedRawTwinoidLink> = new RecordType<VersionedRawTwinoidLink>({
  properties: {
    current: {type: $NullableRawTwinoidLink},
    old: {type: new ArrayType({itemType: $OldRawTwinoidLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
