import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $ErrorLike, ErrorLike } from "../../core/error-like.js";
import { $DinoparcServer, DinoparcServer } from "../dinoparc-server.js";

export interface DinoparcUnknown {
  name: "DinoparcUnknown";
  server: DinoparcServer;
  cause: ErrorLike;
}

export const $DinoparcUnknown: RecordIoType<DinoparcUnknown> = new RecordType<DinoparcUnknown>({
  properties: {
    name: {type: new LiteralType({type: $Ucs2String, value: "DinoparcUnknown"})},
    server: {type: $DinoparcServer},
    cause: {type: $ErrorLike},
  },
  changeCase: CaseStyle.SnakeCase,
});

export class DinoparcUnknownError extends Error implements DinoparcUnknown {
  public name: "DinoparcUnknown";
  public server: DinoparcServer;
  public cause: ErrorLike;

  public constructor(options: Omit<DinoparcUnknown, "name">) {
    super(options.cause.message);
    this.name = "DinoparcUnknown";
    this.server = options.server;
    this.cause = options.cause;
  }
}
