import chai from "chai";

import { HttpTwinoidApiClient } from "../lib/index.js";

describe("HttpTwinoidApiClient", () => {
  it("exists", async () => {
    const twinoid = new HttpTwinoidApiClient();
    chai.assert.isDefined(twinoid);
  });
});
