import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "../hammerfest/hammerfest-user-id.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";

export interface SimpleUnlinkFromHammerfestOptions {
  userId: UserId;
  hammerfestServer: HammerfestServer;
  hammerfestUserId: HammerfestUserId;
  unlinkedBy: UserId;
}

export const $SimpleUnlinkFromHammerfestOptions: RecordIoType<SimpleUnlinkFromHammerfestOptions> = new RecordType<SimpleUnlinkFromHammerfestOptions>({
  properties: {
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUserId: {type: $HammerfestUserId},
    unlinkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
