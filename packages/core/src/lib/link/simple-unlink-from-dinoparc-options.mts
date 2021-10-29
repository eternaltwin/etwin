import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";

export interface SimpleUnlinkFromDinoparcOptions {
  userId: UserId;
  dinoparcServer: DinoparcServer;
  dinoparcUserId: DinoparcUserId;
  unlinkedBy: UserId;
}

export const $SimpleUnlinkFromDinoparcOptions: RecordIoType<SimpleUnlinkFromDinoparcOptions> = new RecordType<SimpleUnlinkFromDinoparcOptions>({
  properties: {
    userId: {type: $UserId},
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUserId: {type: $DinoparcUserId},
    unlinkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
