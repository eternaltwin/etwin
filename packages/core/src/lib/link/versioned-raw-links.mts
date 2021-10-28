import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $VersionedRawDinoparcLink, VersionedRawDinoparcLink } from "./versioned-raw-dinoparc-link.mjs";
import { $VersionedRawHammerfestLink, VersionedRawHammerfestLink } from "./versioned-raw-hammerfest-link.mjs";
import { $VersionedRawTwinoidLink, VersionedRawTwinoidLink } from "./versioned-raw-twinoid-link.mjs";

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
