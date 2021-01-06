import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "kryo/lib/uuid-hex.js";

import native from "../native/index.js";

declare const Uuid4GeneratorBox: unique symbol;

export class Uuid4Generator implements UuidGenerator {
  public readonly box: typeof Uuid4GeneratorBox;

  constructor() {
    this.box = native.uuid.uuid4Generator.new();
  }

  next(): UuidHex {
    return native.uuid.uuid4Generator.next(this.box);
  }
}
