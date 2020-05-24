import chai from "chai";
import url from "url";

import { HttpOauthClientService } from "../lib/index.js";

describe("HttpOauthClientService", () => {
  it("exists", async () => {
    const twinoid = new HttpOauthClientService("380", "aaaa", new url.URL("http://localhost:50320/oauth/callback"));
    chai.assert.isDefined(twinoid);
  });
});
