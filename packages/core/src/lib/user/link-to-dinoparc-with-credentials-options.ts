import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $DinoparcPassword, DinoparcPassword } from "../dinoparc/dinoparc-password.js";
import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.js";
import { $DinoparcUsername, DinoparcUsername } from "../dinoparc/dinoparc-username.js";
import { $LinkToDinoparcMethod, LinkToDinoparcMethod } from "./link-to-dinoparc-method.js";
import { $UserId, UserId } from "./user-id.js";

export interface LinkToDinoparcWithCredentialsOptions {
  method: LinkToDinoparcMethod.Credentials;

  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Dinoparc server.
   */
  dinoparcServer: DinoparcServer;

  /**
   * Username for the Dinoparc user.
   */
  dinoparcUsername: DinoparcUsername;

  /**
   * Password for the Dinoparc user.
   */
  dinoparcPassword: DinoparcPassword;
}

export const $LinkToDinoparcWithCredentialsOptions: RecordIoType<LinkToDinoparcWithCredentialsOptions> = new RecordType<LinkToDinoparcWithCredentialsOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToDinoparcMethod, value: LinkToDinoparcMethod.Credentials})},
    userId: {type: $UserId},
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUsername: {type: $DinoparcUsername},
    dinoparcPassword: {type: $DinoparcPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});
