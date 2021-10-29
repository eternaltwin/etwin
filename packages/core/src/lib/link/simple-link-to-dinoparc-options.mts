import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";

export interface SimpleLinkToDinoparcOptions {
  userId: UserId;
  dinoparcServer: DinoparcServer;
  dinoparcUserId: DinoparcUserId;
  linkedBy: UserId;
}

export const $SimpleLinkToDinoparcOptions: RecordIoType<SimpleLinkToDinoparcOptions> = new RecordType<SimpleLinkToDinoparcOptions>({
  properties: {
    userId: {type: $UserId},
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUserId: {type: $DinoparcUserId},
    linkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
