import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link to an Eternal-Twin user.
 */
export interface OldEtwinLink {
  link: LinkAction;
  unlink: LinkAction;
  user: ShortUser;
}

export const $OldEtwinLink: RecordIoType<OldEtwinLink> = new RecordType<OldEtwinLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
