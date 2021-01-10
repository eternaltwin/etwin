import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $VersionedRawDinoparcLink, VersionedRawDinoparcLink } from "./versioned-raw-dinoparc-link.js";
import { $VersionedRawHammerfestLink, VersionedRawHammerfestLink } from "./versioned-raw-hammerfest-link.js";
import { $VersionedRawTwinoidLink, VersionedRawTwinoidLink } from "./versioned-raw-twinoid-link.js";

/**
 * Versioned links from an Eternal-Twin user.
 */
export interface VersionedRawLinks {
  dinoparcCom: VersionedRawDinoparcLink;
  enDinoparcCom: VersionedRawDinoparcLink;
  hammerfestEs: VersionedRawHammerfestLink;
  hammerfestFr: VersionedRawHammerfestLink;
  hfestNet: VersionedRawHammerfestLink;
  spDinoparcCom: VersionedRawDinoparcLink;
  twinoid: VersionedRawTwinoidLink;
}

export const $VersionedRawLinks: RecordIoType<VersionedRawLinks> = new RecordType<VersionedRawLinks>({
  properties: {
    dinoparcCom: {type: $VersionedRawDinoparcLink},
    enDinoparcCom: {type: $VersionedRawDinoparcLink},
    hammerfestEs: {type: $VersionedRawHammerfestLink},
    hammerfestFr: {type: $VersionedRawHammerfestLink},
    hfestNet: {type: $VersionedRawHammerfestLink},
    spDinoparcCom: {type: $VersionedRawDinoparcLink},
    twinoid: {type: $VersionedRawTwinoidLink},
  },
  changeCase: CaseStyle.SnakeCase,
});
