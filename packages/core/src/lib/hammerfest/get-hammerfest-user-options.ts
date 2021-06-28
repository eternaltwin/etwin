import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";

export interface GetHammerfestUserOptions {
  server: HammerfestServer;
  id: HammerfestUserId;
  time?: Date;
}

export const $GetHammerfestUserOptions: RecordIoType<GetHammerfestUserOptions> = new RecordType<GetHammerfestUserOptions>({
  properties: {
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
