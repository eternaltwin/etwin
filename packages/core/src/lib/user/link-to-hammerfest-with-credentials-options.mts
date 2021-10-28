import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestPassword, HammerfestPassword } from "../hammerfest/hammerfest-password.mjs";
import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { $HammerfestUsername, HammerfestUsername } from "../hammerfest/hammerfest-username.mjs";
import { $LinkToHammerfestMethod, LinkToHammerfestMethod } from "./link-to-hammerfest-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface LinkToHammerfestWithCredentialsOptions {
  method: LinkToHammerfestMethod.Credentials;

  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Hammerfest server.
   */
  hammerfestServer: HammerfestServer;

  /**
   * Username for the Hammerfest user.
   */
  hammerfestUsername: HammerfestUsername;

  /**
   * Password for the Hammerfest user.
   */
  hammerfestPassword: HammerfestPassword;
}

export const $LinkToHammerfestWithCredentialsOptions: RecordIoType<LinkToHammerfestWithCredentialsOptions> = new RecordType<LinkToHammerfestWithCredentialsOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToHammerfestMethod, value: LinkToHammerfestMethod.Credentials})},
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUsername: {type: $HammerfestUsername},
    hammerfestPassword: {type: $HammerfestPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});
