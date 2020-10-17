import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $HammerfestUserRef, HammerfestUserRef } from "../hammerfest/hammerfest-user-ref.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link from an Eternal-Twin user to a Hammerfest user.
 */
export interface HammerfestLink {
  link: LinkAction;
  unlink: null;
  user: HammerfestUserRef;
}

export const $HammerfestLink: RecordIoType<HammerfestLink> = new RecordType<HammerfestLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $HammerfestUserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestLink = null | HammerfestLink;

export const $NullableHammerfestLink: TryUnionType<NullableHammerfestLink> = new TryUnionType({variants: [$Null, $HammerfestLink]});
