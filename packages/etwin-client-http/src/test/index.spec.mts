import { Url } from "@eternal-twin/core/core/url";
import chai from "chai";

import { HttpEtwinClient } from "../lib/index.mjs";

describe("HttpEtwinClient", () => {
  it("compiles", async () => {
    const baseUri: Url = new Url("https://eternal-twin.net");
    const client = new HttpEtwinClient(baseUri);
    chai.assert.isDefined(client);
  });
});
