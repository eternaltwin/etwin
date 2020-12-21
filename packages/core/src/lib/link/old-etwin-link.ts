import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDot, UserDot } from "../core/user-dot.js";
import { $ShortUser, ShortUser } from "../user/short-user.js";

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
