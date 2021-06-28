import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $OldRawDinoparcLink, OldRawDinoparcLink } from "./old-raw-dinoparc-link.js";
import { $NullableRawDinoparcLink, NullableRawDinoparcLink } from "./raw-dinoparc-link.js";

export interface VersionedRawDinoparcLink {
  current: NullableRawDinoparcLink;
  old: OldRawDinoparcLink[];
}

export const $VersionedRawDinoparcLink: RecordIoType<VersionedRawDinoparcLink> = new RecordType<VersionedRawDinoparcLink>({
  properties: {
    current: {type: $NullableRawDinoparcLink},
    old: {type: new ArrayType({itemType: $OldRawDinoparcLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
