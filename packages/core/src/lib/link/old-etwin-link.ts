import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link to an Eternal-Twin user.
 */
export interface OldEtwinLink {
  link: LinkAction;
  unlink: LinkAction;
  user: UserRef;
}

export const $OldEtwinLink: RecordIoType<OldEtwinLink> = new RecordType<OldEtwinLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $UserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
