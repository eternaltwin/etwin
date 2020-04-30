import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { UuidHex } from "@eternal-twin/core/lib/core/uuid-hex.js";
import uuidjs from "uuidjs";

const UUID4_GENERATOR: UuidGenerator = {
  next(): UuidHex {
    return uuidjs.genV4().toString();
  },
};

export { UUID4_GENERATOR, UUID4_GENERATOR as default };
