import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.mjs";

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
