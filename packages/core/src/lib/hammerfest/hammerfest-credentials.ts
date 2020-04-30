import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Password, Password } from "../password/password.js";
import { $HammerfestLogin, HammerfestLogin } from "./hammerfest-login.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";

export interface HammerfestCredentials {
  server: HammerfestServer;
  login: HammerfestLogin;
  password: Password;
}

export const $HammerfestCredentials: RecordIoType<HammerfestCredentials> = new RecordType<HammerfestCredentials>({
  properties: {
    server: {type: $HammerfestServer},
    login: {type: $HammerfestLogin},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
