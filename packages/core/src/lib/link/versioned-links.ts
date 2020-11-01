import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $VersionedDinoparcLink, VersionedDinoparcLink } from "./versioned-dinoparc-link.js";
import { $VersionedHammerfestLink, VersionedHammerfestLink } from "./versioned-hammerfest-link.js";
import { $VersionedTwinoidLink, VersionedTwinoidLink } from "./versioned-twinoid-link.js";

/**
 * Versioned links from an Eternal-Twin user.
 */
export interface VersionedLinks {
  dinoparcCom: VersionedDinoparcLink;
  enDinoparcCom: VersionedDinoparcLink;
  hammerfestEs: VersionedHammerfestLink;
  hammerfestFr: VersionedHammerfestLink;
  hfestNet: VersionedHammerfestLink;
  spDinoparcCom: VersionedDinoparcLink;
  twinoid: VersionedTwinoidLink;
}

export const $VersionedLinks: RecordIoType<VersionedLinks> = new RecordType<VersionedLinks>({
  properties: {
    dinoparcCom: {type: $VersionedDinoparcLink},
    enDinoparcCom: {type: $VersionedDinoparcLink},
    hammerfestEs: {type: $VersionedHammerfestLink},
    hammerfestFr: {type: $VersionedHammerfestLink},
    hfestNet: {type: $VersionedHammerfestLink},
    spDinoparcCom: {type: $VersionedDinoparcLink},
    twinoid: {type: $VersionedTwinoidLink},
  },
  changeCase: CaseStyle.SnakeCase,
});
