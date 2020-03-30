import * as assert from "assert";
import { Serializer } from "../../lib/haxe/serializer.js";

describe("Serializer", () => {
  describe("run", () => {
    it("null", () => {
      const actual: string = Serializer.run(null);
      const expected: string = "n";
      assert.strictEqual(actual, expected);
    });

    it("0", () => {
      const actual: string = Serializer.run(0);
      const expected: string = "z";
      assert.strictEqual(actual, expected);
    });

    it("-Infinity", () => {
      const actual: string = Serializer.run(-Infinity);
      const expected: string = "m";
      assert.strictEqual(actual, expected);
    });

    it("+Infinity", () => {
      const actual: string = Serializer.run(+Infinity);
      const expected: string = "p";
      assert.strictEqual(actual, expected);
    });
  });
});
