import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Password, Password } from "../password/password.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.js";

export interface HammerfestCredentials {
  server: HammerfestServer;
  username: HammerfestUsername;
  password: Password;
}

export const $HammerfestCredentials: RecordIoType<HammerfestCredentials> = new RecordType<HammerfestCredentials>({
  properties: {
    server: {type: $HammerfestServer},
    username: {type: $HammerfestUsername},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
