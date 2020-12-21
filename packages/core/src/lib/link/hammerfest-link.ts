import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $UserDot, UserDot } from "../core/user-dot.js";
import { $ShortHammerfestUser, ShortHammerfestUser } from "../hammerfest/short-hammerfest-user.js";

/**
 * Active link from an Eternal-Twin user to a Hammerfest user.
 */
export interface HammerfestLink {
  link: UserDot;
  unlink: null;
  user: ShortHammerfestUser;
}

export const $HammerfestLink: RecordIoType<HammerfestLink> = new RecordType<HammerfestLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $Null},
    user: {type: $ShortHammerfestUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestLink = null | HammerfestLink;

export const $NullableHammerfestLink: TryUnionType<NullableHammerfestLink> = new TryUnionType({variants: [$Null, $HammerfestLink]});
