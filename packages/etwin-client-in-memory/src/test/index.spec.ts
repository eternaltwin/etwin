import chai from "chai";

import { InMemoryEtwinClient } from "../lib/index.js";

describe("InMemoryEtwinClient", () => {
  it("compiles", async () => {
    const client = new InMemoryEtwinClient();
    chai.assert.isDefined(client);
  });
});
