import chai from "chai";
import url from "url";

import { HttpEtwinClient } from "../lib/index.js";

describe("HttpEtwinClient", () => {
  it("compiles", async () => {
    const baseUri: url.URL = new url.URL("https://eternal-twin.net");
    const client = new HttpEtwinClient(baseUri);
    chai.assert.isDefined(client);
  });
});
