import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";

export interface HammerfestGetProfileByIdOptions {
  server: HammerfestServer;
  userId: HammerfestUserId;
}

export const $HammerfestGetProfileByIdOptions: RecordIoType<HammerfestGetProfileByIdOptions> = new RecordType<HammerfestGetProfileByIdOptions>({
  properties: {
    server: {type: $HammerfestServer},
    userId: {type: $HammerfestUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
