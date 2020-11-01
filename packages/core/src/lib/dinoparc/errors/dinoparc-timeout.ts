import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $DinoparcServer, DinoparcServer } from "../dinoparc-server.js";

export interface DinoparcTimeout {
  name: "DinoparcTimeout";
  server: DinoparcServer;
  /**
   * Timeout in milliseconds
   */
  timeout: number;
}

export const $DinoparcTimeout: RecordIoType<DinoparcTimeout> = new RecordType<DinoparcTimeout>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "DinoparcTimeout"})},
    server: {type: $DinoparcServer},
    timeout: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class DinoparcTimeoutError extends Error implements DinoparcTimeout {
  public name: "DinoparcTimeout";
  public server: DinoparcServer;
  public timeout: number;

  public constructor(options: Omit<DinoparcTimeout, "name">) {
    const message: string = `Server: ${options.server}, timeout: ${JSON.stringify(options.timeout)}`;
    super(message);
    this.name = "DinoparcTimeout";
    this.server = options.server;
    this.timeout = options.timeout;
  }
}
