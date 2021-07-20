import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableDinoparcLink, NullableDinoparcLink } from "./dinoparc-link.js";
import { $OldDinoparcLink, OldDinoparcLink } from "./old-dinoparc-link.js";

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
