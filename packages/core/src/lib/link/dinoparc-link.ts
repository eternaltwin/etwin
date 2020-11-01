import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ShortDinoparcUser, ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Active link from an Eternal-Twin user to a Dinoparc user.
 */
export interface DinoparcLink {
  link: LinkAction;
  unlink: null;
  user: ShortDinoparcUser;
}

export const $DinoparcLink: RecordIoType<DinoparcLink> = new RecordType<DinoparcLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $Null},
    user: {type: $ShortDinoparcUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableDinoparcLink = null | DinoparcLink;

export const $NullableDinoparcLink: TryUnionType<NullableDinoparcLink> = new TryUnionType({variants: [$Null, $DinoparcLink]});
