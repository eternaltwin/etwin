import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortUser, ShortUser } from "../user/short-user.mjs";

/**
 * Inactive link to an Eternal-Twin user.
 */
export interface OldEtwinLink {
  link: UserDot;
  unlink: UserDot;
  user: ShortUser;
}

export const $OldEtwinLink: RecordIoType<OldEtwinLink> = new RecordType<OldEtwinLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $UserDot},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
