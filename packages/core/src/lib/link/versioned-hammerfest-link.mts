import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableHammerfestLink, NullableHammerfestLink } from "./hammerfest-link.mjs";
import { $OldHammerfestLink, OldHammerfestLink } from "./old-hammerfest-link.mjs";

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
