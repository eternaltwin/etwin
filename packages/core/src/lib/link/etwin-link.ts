import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link to an Eternal-Twin user.
 */
export interface EtwinLink {
  link: LinkAction;
  unlink: null;
  user: ShortUser;
}

export const $EtwinLink: RecordIoType<EtwinLink> = new RecordType<EtwinLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableEtwinLink = null | EtwinLink;

export const $NullableEtwinLink: TryUnionType<NullableEtwinLink> = new TryUnionType({variants: [$Null, $EtwinLink]});
