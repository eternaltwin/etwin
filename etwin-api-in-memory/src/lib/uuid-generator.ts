import { UuidHex } from "@eternal-twin/etwin-api-types/core/uuid-hex.js";
import uuidjs from "uuidjs";

export interface UuidGenerator {
  next(): UuidHex;
}

export const UUID4_GENERATOR: UuidGenerator = {
  next(): UuidHex {
    return uuidjs.genV4().toString();
  },
};
