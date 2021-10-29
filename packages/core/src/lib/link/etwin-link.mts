import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortUser, ShortUser } from "../user/short-user.mjs";

/**
 * Active link to an Eternal-Twin user.
 */
export interface EtwinLink {
  link: UserDot;
  unlink: null;
  user: ShortUser;
}

export const $EtwinLink: RecordIoType<EtwinLink> = new RecordType<EtwinLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $Null},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableEtwinLink = null | EtwinLink;

export const $NullableEtwinLink: TryUnionType<NullableEtwinLink> = new TryUnionType({variants: [$Null, $EtwinLink]});
