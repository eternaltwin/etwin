import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { UuidHex } from "kryo/uuid-hex";

import native from "../native/index.js";

declare const Uuid4GeneratorBox: unique symbol;
export type NativeUuidGeneratorBox = typeof Uuid4GeneratorBox;

export abstract class NativeUuidGenerator implements UuidGenerator {
  public readonly box: NativeUuidGeneratorBox;

  constructor(box: NativeUuidGeneratorBox) {
    this.box = box;
  }

  next(): UuidHex {
    return native.uuid.uuid4Generator.next(this.box);
  }
}

export class Uuid4Generator extends NativeUuidGenerator {
  constructor() {
    super(native.uuid.uuid4Generator.new());
  }
}
