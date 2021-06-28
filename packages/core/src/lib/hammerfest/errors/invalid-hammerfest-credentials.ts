import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { $Ucs2String } from "kryo/lib/ucs2-string";

import { $HammerfestServer, HammerfestServer } from "../hammerfest-server.js";
import { $HammerfestUsername, HammerfestUsername } from "../hammerfest-username.js";

export interface InvalidHammerfestCredentials {
  name: "InvalidHammerfestCredentials";
  server: HammerfestServer;
  username: HammerfestUsername;
}

export const $InvalidHammerfestCredentials: RecordIoType<InvalidHammerfestCredentials> = new RecordType<InvalidHammerfestCredentials>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "InvalidHammerfestCredentials"})},
    server: {type: $HammerfestServer},
    username: {type: $HammerfestUsername},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class InvalidHammerfestCredentialsError extends Error implements InvalidHammerfestCredentials {
  public name: "InvalidHammerfestCredentials";
  public server: HammerfestServer;
  public username: HammerfestUsername;

  public constructor(options: Omit<InvalidHammerfestCredentials, "name">) {
    const message: string = `Server: ${options.server}, username: ${JSON.stringify(options.username)}`;
    super(message);
    this.name = "InvalidHammerfestCredentials";
    this.server = options.server;
    this.username = options.username;
  }
}
