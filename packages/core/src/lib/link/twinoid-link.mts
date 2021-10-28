import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortTwinoidUser, ShortTwinoidUser } from "../twinoid/short-twinoid-user.mjs";

/**
 * Active link from an Eternal-Twin user to a Twinoid user.
 */
export interface TwinoidLink {
  link: UserDot;
  unlink: null;
  user: ShortTwinoidUser;
}

export const $TwinoidLink: RecordIoType<TwinoidLink> = new RecordType<TwinoidLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $Null},
    user: {type: $ShortTwinoidUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidLink = null | TwinoidLink;

export const $NullableTwinoidLink: TryUnionType<NullableTwinoidLink> = new TryUnionType({variants: [$Null, $TwinoidLink]});
