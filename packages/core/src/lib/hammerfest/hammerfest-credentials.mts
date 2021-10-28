import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestPassword, HammerfestPassword } from "./hammerfest-password.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.mjs";

export interface HammerfestCredentials {
  server: HammerfestServer;
  username: HammerfestUsername;
  password: HammerfestPassword;
}

export const $HammerfestCredentials: RecordIoType<HammerfestCredentials> = new RecordType<HammerfestCredentials>({
  properties: {
    server: {type: $HammerfestServer},
    username: {type: $HammerfestUsername},
    password: {type: $HammerfestPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});
