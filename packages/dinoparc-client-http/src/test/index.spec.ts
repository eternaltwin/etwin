import chai from "chai";

import { HttpDinoparcClientService } from "../lib/index.js";

describe("HttpDinoparcClientService", () => {
  it("exists", async () => {
    const dinoparcClient = new HttpDinoparcClientService();
    chai.assert.isDefined(dinoparcClient);
  });
});
