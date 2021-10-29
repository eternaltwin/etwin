import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "../hammerfest/hammerfest-user-id.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";

export interface SimpleLinkToHammerfestOptions {
  userId: UserId;
  hammerfestServer: HammerfestServer;
  hammerfestUserId: HammerfestUserId;
  linkedBy: UserId;
}

export const $SimpleLinkToHammerfestOptions: RecordIoType<SimpleLinkToHammerfestOptions> = new RecordType<SimpleLinkToHammerfestOptions>({
  properties: {
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUserId: {type: $HammerfestUserId},
    linkedBy: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
