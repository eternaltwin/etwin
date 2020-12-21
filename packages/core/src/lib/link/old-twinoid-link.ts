import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortTwinoidUser, ShortTwinoidUser } from "../twinoid/short-twinoid-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link from an Eternal-Twin user to a Twinoid user.
 */
export interface OldTwinoidLink {
  link: LinkAction;
  unlink: LinkAction;
  user: ShortTwinoidUser;
}

export const $OldTwinoidLink: RecordIoType<OldTwinoidLink> = new RecordType<OldTwinoidLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $ShortTwinoidUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
