import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ShortTwinoidUser, ShortTwinoidUser } from "../twinoid/short-twinoid-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link from an Eternal-Twin user to a Twinoid user.
 */
export interface TwinoidLink {
  link: LinkAction;
  unlink: null;
  user: ShortTwinoidUser;
}

export const $TwinoidLink: RecordIoType<TwinoidLink> = new RecordType<TwinoidLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $ShortTwinoidUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidLink = null | TwinoidLink;

export const $NullableTwinoidLink: TryUnionType<NullableTwinoidLink> = new TryUnionType({variants: [$Null, $TwinoidLink]});
