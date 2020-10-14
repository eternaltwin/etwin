import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.js";
import { $HammerfestUsername, HammerfestUsername } from "../hammerfest/hammerfest-username.js";
import { $UserId, UserId } from "../user/user-id.js";

export interface LinkHammerfestUserOptions {
  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Hammerfest server.
   */
  hammerfestServer: HammerfestServer;

  /**
   * Login for the Hammerfest user.
   */
  hammerfestUsername: HammerfestUsername;

  /**
   * Password for the Hammerfest user.
   */
  hammerfestPassword: string;
}

export const $LinkHammerfestUserOptions: RecordIoType<LinkHammerfestUserOptions> = new RecordType<LinkHammerfestUserOptions>({
  properties: {
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUsername: {type: $HammerfestUsername},
    hammerfestPassword: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
