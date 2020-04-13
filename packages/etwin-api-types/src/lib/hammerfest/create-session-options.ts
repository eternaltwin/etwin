import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestLogin, HammerfestLogin } from "./hammerfest-login.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";

export interface CreateSessionOptions {
  server: HammerfestServer;
  login: HammerfestLogin;
  password: string;
}

export const $CreateSessionOptions: RecordIoType<CreateSessionOptions> = new RecordType<CreateSessionOptions>({
  properties: {
    server: {type: $HammerfestServer},
    login: {type: $HammerfestLogin},
    password: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
