import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortHammerfestUser, ShortHammerfestUser } from "../hammerfest/short-hammerfest-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link from an Eternal-Twin user to a Hammerfest user.
 */
export interface OldHammerfestLink {
  link: LinkAction;
  unlink: LinkAction;
  user: ShortHammerfestUser;
}

export const $OldHammerfestLink: RecordIoType<OldHammerfestLink> = new RecordType<OldHammerfestLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $ShortHammerfestUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
