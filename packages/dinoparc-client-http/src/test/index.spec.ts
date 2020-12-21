import chai from "chai";

import { HttpDinoparcClient } from "../lib/index.js";

describe("HttpDinoparcClientService", () => {
  it("exists", async () => {
    const dinoparcClient = new HttpDinoparcClient();
    chai.assert.isDefined(dinoparcClient);
  });
});
