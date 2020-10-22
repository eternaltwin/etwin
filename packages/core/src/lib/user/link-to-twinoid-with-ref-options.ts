import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";
import { $LinkToTwinoidMethod, LinkToTwinoidMethod } from "./link-to-twinoid-method.js";
import { $UserId, UserId } from "./user-id.js";

export interface LinkToTwinoidWithRefOptions {
  method: LinkToTwinoidMethod.Ref;

  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * User id for the Twinoid user.
   */
  twinoidUserId: TwinoidUserId;
}

export const $LinkToTwinoidWithRefOptions: RecordIoType<LinkToTwinoidWithRefOptions> = new RecordType<LinkToTwinoidWithRefOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToTwinoidMethod, value: LinkToTwinoidMethod.Ref})},
    userId: {type: $UserId},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
