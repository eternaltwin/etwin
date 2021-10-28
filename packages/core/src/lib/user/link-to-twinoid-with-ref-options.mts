import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.mjs";
import { $LinkToTwinoidMethod, LinkToTwinoidMethod } from "./link-to-twinoid-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

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
