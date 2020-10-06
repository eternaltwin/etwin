import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import chai from "chai";
import url from "url";

import { HttpOauthClientService } from "../lib/index.js";

describe("HttpOauthClientService", () => {
  it("exists", async () => {
    const twinoid: OauthClientService = new HttpOauthClientService(
      new url.URL("http://twinoid.com/oauth/auth"),
      new url.URL("http://twinoid.com/oauth/token"),
      "380",
      "aaaa",
      new url.URL("http://eternal-twin.net/oauth/callback"),
      Buffer.from("dev_secret"),
    );
    chai.assert.isDefined(twinoid);
  });
});
