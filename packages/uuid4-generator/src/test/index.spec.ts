import { $UuidHex } from "@eternal-twin/etwin-api-types/lib/core/uuid-hex.js";
import chai from "chai";

import { UUID4_GENERATOR } from "../lib/index.js";

describe("UUID_GENERATOR", () => {
  it("generates a UUID", () => {
    const id = UUID4_GENERATOR.next();
    chai.assert.isTrue($UuidHex.test(id));
  });

  it("generates many UUIDs", () => {
    const first = UUID4_GENERATOR.next();
    chai.assert.isTrue($UuidHex.test(first));
    const second = UUID4_GENERATOR.next();
    chai.assert.isTrue($UuidHex.test(second));
    chai.assert.notStrictEqual(first, second);
  });
});
