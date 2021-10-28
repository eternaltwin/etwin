import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "../hammerfest/hammerfest-user-id.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface UnlinkFromHammerfestOptions {
  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Hammerfest server.
   */
  hammerfestServer: HammerfestServer;

  /**
   * User id for the Hammerfest user.
   */
  hammerfestUserId: HammerfestUserId;
}

export const $UnlinkFromHammerfestOptions: RecordIoType<UnlinkFromHammerfestOptions> = new RecordType<UnlinkFromHammerfestOptions>({
  properties: {
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUserId: {type: $HammerfestUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
