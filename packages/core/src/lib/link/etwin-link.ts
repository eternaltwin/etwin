import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link to an Eternal-Twin user.
 */
export interface EtwinLink {
  link: LinkAction;
  unlink: null;
  user: UserRef;
}

export const $EtwinLink: RecordIoType<EtwinLink> = new RecordType<EtwinLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $UserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableEtwinLink = null | EtwinLink;

export const $NullableEtwinLink: TryUnionType<NullableEtwinLink> = new TryUnionType({variants: [$Null, $EtwinLink]});
