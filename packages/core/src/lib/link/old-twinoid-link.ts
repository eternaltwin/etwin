import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $TwinoidUserRef, TwinoidUserRef } from "../twinoid/twinoid-user-ref.js";
import { $LinkAction, LinkAction } from "./link-action.js";

/**
 * Inactive link from an Eternal-Twin user to a Twinoid user.
 */
export interface OldTwinoidLink {
  link: LinkAction;
  unlink: LinkAction;
  user: TwinoidUserRef;
}

export const $OldTwinoidLink: RecordIoType<OldTwinoidLink> = new RecordType<OldTwinoidLink>({
  properties: {
    link: {type: $LinkAction},
    unlink: {type: $LinkAction},
    user: {type: $TwinoidUserRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
