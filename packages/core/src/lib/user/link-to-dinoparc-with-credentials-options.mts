import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcPassword, DinoparcPassword } from "../dinoparc/dinoparc-password.mjs";
import { $DinoparcServer, DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { $DinoparcUsername, DinoparcUsername } from "../dinoparc/dinoparc-username.mjs";
import { $LinkToDinoparcMethod, LinkToDinoparcMethod } from "./link-to-dinoparc-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

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
