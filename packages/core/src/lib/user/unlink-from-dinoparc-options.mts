import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface UnlinkFromDinoparcOptions {
  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Dinoparc server.
   */
  dinoparcServer: DinoparcServer;

  /**
   * User id for the Dinoparc user.
   */
  dinoparcUserId: DinoparcUserId;
}

export const $UnlinkFromDinoparcOptions: RecordIoType<UnlinkFromDinoparcOptions> = new RecordType<UnlinkFromDinoparcOptions>({
  properties: {
    userId: {type: $UserId},
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUserId: {type: $DinoparcUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
