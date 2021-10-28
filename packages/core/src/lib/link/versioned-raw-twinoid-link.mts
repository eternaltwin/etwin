import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $OldRawTwinoidLink, OldRawTwinoidLink } from "./old-raw-twinoid-link.mjs";
import { $NullableRawTwinoidLink, NullableRawTwinoidLink } from "./raw-twinoid-link.mjs";

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
