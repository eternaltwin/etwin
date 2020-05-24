import chai from "chai";

import { HttpHammerfestService } from "../lib/index.js";

describe("HttpHammerfestService", () => {
  it("exists", async () => {
    const hammerfest = new HttpHammerfestService();
    chai.assert.isDefined(hammerfest);
  });
});
