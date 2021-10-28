import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $OldRawDinoparcLink, OldRawDinoparcLink } from "./old-raw-dinoparc-link.mjs";
import { $NullableRawDinoparcLink, NullableRawDinoparcLink } from "./raw-dinoparc-link.mjs";

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
