import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortUser, ShortUser } from "../user/short-user.js";

/**
 * Object describe a link or unlink: the time and user for the action.
 */
export interface LinkAction {
  time: Date;
  user: ShortUser;
}

export const $LinkAction: RecordIoType<LinkAction> = new RecordType<LinkAction>({
  properties: {
    time: {type: $Date},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
