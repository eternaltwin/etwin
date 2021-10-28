import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableDinoparcLink, NullableDinoparcLink } from "./dinoparc-link.mjs";
import { $OldDinoparcLink, OldDinoparcLink } from "./old-dinoparc-link.mjs";

/**
 * Versioned link from an Eternal-Twin user to a Dinoparc user.
 */
export interface VersionedDinoparcLink {
  current: NullableDinoparcLink;
  old: OldDinoparcLink[];
}

export const $VersionedDinoparcLink: RecordIoType<VersionedDinoparcLink> = new RecordType<VersionedDinoparcLink>({
  properties: {
    current: {type: $NullableDinoparcLink},
    old: {type: new ArrayType({itemType: $OldDinoparcLink, maxLength: Infinity})},
  },
  changeCase: CaseStyle.SnakeCase,
});
