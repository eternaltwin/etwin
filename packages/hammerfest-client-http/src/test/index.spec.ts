import chai from "chai";

import { HttpHammerfestClientService } from "../lib/index.js";

describe("HttpHammerfestClientService", () => {
  it("exists", async () => {
    const hammerfest = new HttpHammerfestClientService();
    chai.assert.isDefined(hammerfest);
  });
});
