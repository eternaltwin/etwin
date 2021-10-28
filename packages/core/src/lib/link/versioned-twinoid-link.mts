import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $OldTwinoidLink, OldTwinoidLink } from "./old-twinoid-link.mjs";
import { $NullableTwinoidLink, NullableTwinoidLink } from "./twinoid-link.mjs";

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
