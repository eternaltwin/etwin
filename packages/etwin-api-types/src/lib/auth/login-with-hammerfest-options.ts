import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestLogin, HammerfestLogin } from "../hammerfest/hammerfest-login";
import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server";

export interface LoginWithHammerfestOptions {
  /**
   * Hammerfest server.
   */
  server: HammerfestServer;

  /**
   * Login for the Hammerfest user.
   */
  login: HammerfestLogin;

  /**
   * Password for the Hammerfest user.
   */
  password: string;
}

export const $LoginWithHammerfestOptions: RecordIoType<LoginWithHammerfestOptions> = new RecordType<LoginWithHammerfestOptions>({
  properties: {
    server: {type: $HammerfestServer},
    login: {type: $HammerfestLogin},
    password: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
