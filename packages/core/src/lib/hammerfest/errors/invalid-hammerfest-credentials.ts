import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $HammerfestLogin, HammerfestLogin } from "../hammerfest-login.js";
import { $HammerfestServer, HammerfestServer } from "../hammerfest-server.js";

export interface InvalidHammerfestCredentials {
  name: "InvalidHammerfestCredentials";
  server: HammerfestServer;
  login: HammerfestLogin;
}

export const $InvalidHammerfestCredentials: RecordIoType<InvalidHammerfestCredentials> = new RecordType<InvalidHammerfestCredentials>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "InvalidHammerfestCredentials"})},
    server: {type: $HammerfestServer},
    login: {type: $HammerfestLogin},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class InvalidHammerfestCredentialsError extends Error implements InvalidHammerfestCredentials {
  public name: "InvalidHammerfestCredentials";
  public server: HammerfestServer;
  public login: HammerfestLogin;

  public constructor(options: Omit<InvalidHammerfestCredentials, "name">) {
    const message: string = `Server: ${options.server}, username: ${JSON.stringify(options.login)}`;
    super(message);
    this.name = "InvalidHammerfestCredentials";
    this.server = options.server;
    this.login = options.login;
  }
}
