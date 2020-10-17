import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OldTwinoidLink, OldTwinoidLink } from "./old-twinoid-link.js";
import { $NullableTwinoidLink, NullableTwinoidLink } from "./twinoid-link.js";

/**
 * Versioned link from an Eternal-Twin user to a Twinoid user.
 */
export interface VersionedTwinoidLink {
  current: NullableTwinoidLink;
  old: OldTwinoidLink[];
}

export const $VersionedTwinoidLink: RecordIoType<VersionedTwinoidLink> = new RecordType<VersionedTwinoidLink>({
  properties: {
    current: {type: $NullableTwinoidLink},
    old: {type: new ArrayType({itemType: $OldTwinoidLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
