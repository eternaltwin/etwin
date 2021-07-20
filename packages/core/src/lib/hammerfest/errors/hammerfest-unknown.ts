import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $ErrorLike, ErrorLike } from "../../core/error-like.js";
import { $HammerfestServer, HammerfestServer } from "../hammerfest-server.js";

export interface HammerfestUnknown {
  name: "HammerfestUnknown";
  server: HammerfestServer;
  cause: ErrorLike;
}

export const $HammerfestUnknown: RecordIoType<HammerfestUnknown> = new RecordType<HammerfestUnknown>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "HammerfestUnknown"})},
    server: {type: $HammerfestServer},
    cause: {type: $ErrorLike},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class HammerfestUnknownError extends Error implements HammerfestUnknown {
  public name: "HammerfestUnknown";
  public server: HammerfestServer;
  public cause: ErrorLike;

  public constructor(options: Omit<HammerfestUnknown, "name">) {
    super(options.cause.message);
    this.name = "HammerfestUnknown";
    this.server = options.server;
    this.cause = options.cause;
  }
}
