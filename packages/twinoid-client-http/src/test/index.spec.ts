import chai from "chai";

import { HttpTwinoidClientService } from "../lib/index.js";

describe("HttpTwinoidApiClient", () => {
  it("exists", async () => {
    const twinoid = new HttpTwinoidClientService();
    chai.assert.isDefined(twinoid);
  });
});
