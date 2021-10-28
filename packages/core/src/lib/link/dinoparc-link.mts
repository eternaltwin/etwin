import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortDinoparcUser, ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.mjs";

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
