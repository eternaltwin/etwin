import { StringBuf } from "../lib/string-buf.js";
import * as assert from "assert";

describe("StringBuf", () => {
  it("toString", () => {
    const buf = new StringBuf();
    const actual: string = buf.toString();
    const expected: string = "";
    assert.strictEqual(actual, expected);
  });
});
