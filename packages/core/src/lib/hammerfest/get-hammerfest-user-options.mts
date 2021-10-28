import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.mjs";

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
