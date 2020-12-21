import chai from "chai";

import { HttpHammerfestClient } from "../lib/index.js";

describe("HttpHammerfestClient", () => {
  it("exists", async () => {
    const hammerfest = new HttpHammerfestClient();
    chai.assert.isDefined(hammerfest);
  });
});
