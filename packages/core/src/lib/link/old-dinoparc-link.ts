import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortDinoparcUser, ShortDinoparcUser } from "../dinoparc/short-dinoparc-user.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link from an Eternal-Twin user to a Dinoparc user.
 */
export interface OldDinoparcLink {
  link: LinkAction;
  unlink: LinkAction;
  user: ShortDinoparcUser;
}

export const $OldDinoparcLink: RecordIoType<OldDinoparcLink> = new RecordType<OldDinoparcLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $ShortDinoparcUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
