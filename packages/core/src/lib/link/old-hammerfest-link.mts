import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserDot, UserDot } from "../core/user-dot.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "../hammerfest/short-hammerfest-user.mjs";

/**
 * Inactive link from an Eternal-Twin user to a Hammerfest user.
 */
export interface OldHammerfestLink {
  link: UserDot;
  unlink: UserDot;
  user: ShortHammerfestUser;
}

export const $OldHammerfestLink: RecordIoType<OldHammerfestLink> = new RecordType<OldHammerfestLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $UserDot},
    user: {type: $ShortHammerfestUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
