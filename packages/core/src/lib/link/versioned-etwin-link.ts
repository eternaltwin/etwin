import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableEtwinLink, NullableEtwinLink } from "./etwin-link.js";
import { $OldEtwinLink, OldEtwinLink } from "./old-etwin-link.js";

/**
 * Versioned link to an Eternal-Twin user.
 */
export interface VersionedEtwinLink {
  current: NullableEtwinLink;
  old: OldEtwinLink[];
}

export const $VersionedEtwinLink: RecordIoType<VersionedEtwinLink> = new RecordType<VersionedEtwinLink>({
  properties: {
    current: {type: $NullableEtwinLink},
    old: {type: new ArrayType({itemType: $OldEtwinLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
