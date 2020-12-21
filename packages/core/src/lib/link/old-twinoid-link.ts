import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDot, UserDot } from "../core/user-dot.js";
import { $ShortTwinoidUser, ShortTwinoidUser } from "../twinoid/short-twinoid-user.js";

/**
 * Inactive link from an Eternal-Twin user to a Twinoid user.
 */
export interface OldTwinoidLink {
  link: UserDot;
  unlink: UserDot;
  user: ShortTwinoidUser;
}

export const $OldTwinoidLink: RecordIoType<OldTwinoidLink> = new RecordType<OldTwinoidLink>({
  properties: {
    link: {type: $UserDot},
    unlink: {type: $UserDot},
    user: {type: $ShortTwinoidUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
