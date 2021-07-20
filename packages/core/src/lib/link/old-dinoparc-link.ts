import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserDot, UserDot } from "../core/user-dot.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.js";

/**
 * Inactive link from an Eternal-Twin user to a Dinoparc user.
 */
export interface OldDinoparcLink {
  link: UserDot;
  unlink: UserDot;
  user: ShortDinoparcUser;
}

export const $OldDinoparcLink: RecordIoType<OldDinoparcLink> = new RecordType<OldDinoparcLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $UserDot},
    user: {type: $ShortDinoparcUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
