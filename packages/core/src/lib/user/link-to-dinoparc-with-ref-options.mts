import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { $LinkToDinoparcMethod, LinkToDinoparcMethod } from "./link-to-dinoparc-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface LinkToDinoparcWithRefOptions {
  method: LinkToDinoparcMethod.Ref;

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

export const $LinkToDinoparcWithRefOptions: RecordIoType<LinkToDinoparcWithRefOptions> = new RecordType<LinkToDinoparcWithRefOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToDinoparcMethod, value: LinkToDinoparcMethod.Ref})},
    userId: {type: $UserId},
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUserId: {type: $DinoparcUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
