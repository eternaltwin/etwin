import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface GetHammerfestUserByIdOptions {
  server: HammerfestServer;
  id: HammerfestUserId;
  time?: Date;
}

export const $GetHammerfestUserByIdOptions: RecordIoType<GetHammerfestUserByIdOptions> = new RecordType<GetHammerfestUserByIdOptions>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
