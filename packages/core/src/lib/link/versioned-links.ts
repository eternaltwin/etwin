import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $VersionedHammerfestLink, VersionedHammerfestLink } from "./versioned-hammerfest-link.js";
import { $VersionedTwinoidLink, VersionedTwinoidLink } from "./versioned-twinoid-link.js";

/**
 * Versioned links from an Eternal-Twin user.
 */
export interface VersionedLinks {
  hammerfestEs: VersionedHammerfestLink;
  hammerfestFr: VersionedHammerfestLink;
  hfestNet: VersionedHammerfestLink;
  twinoid: VersionedTwinoidLink;
}

export const $VersionedLinks: RecordIoType<VersionedLinks> = new RecordType<VersionedLinks>({
  properties: {
    hammerfestEs: {type: $VersionedHammerfestLink},
    hammerfestFr: {type: $VersionedHammerfestLink},
    hfestNet: {type: $VersionedHammerfestLink},
    twinoid: {type: $VersionedTwinoidLink},
  },
  changeCase: CaseStyle.SnakeCase,
});
