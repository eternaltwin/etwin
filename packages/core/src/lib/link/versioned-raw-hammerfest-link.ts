import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OldRawHammerfestLink, OldRawHammerfestLink } from "./old-raw-hammerfest-link.js";
import { $NullableRawHammerfestLink, NullableRawHammerfestLink } from "./raw-hammerfest-link.js";

export interface VersionedRawHammerfestLink {
  current: NullableRawHammerfestLink;
  old: OldRawHammerfestLink[];
}

export const $VersionedRawHammerfestLink: RecordIoType<VersionedRawHammerfestLink> = new RecordType<VersionedRawHammerfestLink>({
  properties: {
    current: {type: $NullableRawHammerfestLink},
    old: {type: new ArrayType({itemType: $OldRawHammerfestLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
