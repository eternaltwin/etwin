import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "../hammerfest/short-hammerfest-user.mjs";

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
