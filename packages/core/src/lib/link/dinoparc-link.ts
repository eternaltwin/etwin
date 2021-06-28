import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

import { $UserDot, UserDot } from "../core/user-dot.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.js";

/**
 * Active link from an Eternal-Twin user to a Dinoparc user.
 */
export interface DinoparcLink {
  link: UserDot;
  unlink: null;
  user: ShortDinoparcUser;
}

export const $DinoparcLink: RecordIoType<DinoparcLink> = new RecordType<DinoparcLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $Null},
    user: {type: $ShortDinoparcUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableDinoparcLink = null | DinoparcLink;

export const $NullableDinoparcLink: TryUnionType<NullableDinoparcLink> = new TryUnionType({variants: [$Null, $DinoparcLink]});
