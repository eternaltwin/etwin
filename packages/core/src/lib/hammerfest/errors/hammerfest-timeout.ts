import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $HammerfestServer, HammerfestServer } from "../hammerfest-server.js";

export interface HammerfestTimeout {
  name: "HammerfestTimeout";
  server: HammerfestServer;
  /**
   * Timeout in milliseconds
   */
  timeout: number;
}

export const $HammerfestTimeout: RecordIoType<HammerfestTimeout> = new RecordType<HammerfestTimeout>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "HammerfestTimeout"})},
    server: {type: $HammerfestServer},
    timeout: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class HammerfestTimeoutError extends Error implements HammerfestTimeout {
  public name: "HammerfestTimeout";
  public server: HammerfestServer;
  public timeout: number;

  public constructor(options: Omit<HammerfestTimeout, "name">) {
    const message: string = `Server: ${options.server}, timeout: ${JSON.stringify(options.timeout)}`;
    super(message);
    this.name = "HammerfestTimeout";
    this.server = options.server;
    this.timeout = options.timeout;
  }
}
