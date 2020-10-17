import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $NullableHammerfestLink, NullableHammerfestLink } from "./hammerfest-link.js";
import { $OldHammerfestLink, OldHammerfestLink } from "./old-hammerfest-link.js";

/**
 * Versioned link from an Eternal-Twin user to a Hammerfest user.
 */
export interface VersionedHammerfestLink {
  current: NullableHammerfestLink;
  old: OldHammerfestLink[];
}

export const $VersionedHammerfestLink: RecordIoType<VersionedHammerfestLink> = new RecordType<VersionedHammerfestLink>({
  properties: {
    current: {type: $NullableHammerfestLink},
    old: {type: new ArrayType({itemType: $OldHammerfestLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
