import { VirtualClockService } from "@eternal-twin/core/lib/clock/virtual.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type.js";
import chai from "chai";
import url from "url";

import { HttpOauthClientService } from "../lib/index.js";

describe("HttpOauthClientService", () => {
  it("can be instantiated", async () => {
    const clock = new VirtualClockService(new Date("2020-10-22T19:28:22.976Z"));
    const twinoid: OauthClientService = new HttpOauthClientService({
      authorizationUri: new url.URL("http://twinoid.com/oauth/auth"),
      callbackUri: new url.URL("http://eternal-twin.net/oauth/callback"),
      clientId: "380",
      clientSecret: "aaaa",
      grantUri: new url.URL("http://twinoid.com/oauth/token"),
      tokenSecret: Buffer.from("dev_secret"),
      clock,
    });
    chai.assert.isDefined(twinoid);
  });

  it("create an authorization request", async () => {
    const clock = new VirtualClockService(new Date("2020-10-22T19:28:22.976Z"));
    const twinoid: OauthClientService = new HttpOauthClientService({
      authorizationUri: new url.URL("http://twinoid.com/oauth/auth"),
      callbackUri: new url.URL("http://eternal-twin.net/oauth/callback"),
      clientId: "380",
      clientSecret: "aaaa",
      grantUri: new url.URL("http://twinoid.com/oauth/token"),
      tokenSecret: Buffer.from("dev_secret"),
      clock,
    });

    const actual: url.URL = await twinoid.createAuthorizationRequest(
      {
        requestForgeryProtection: "aaa",
        action: {
          type: EtwinOauthActionType.Login,
        },
      },
      []
    );
    const expected = new url.URL("http://twinoid.com/oauth/auth?response_type=code&client_id=380&redirect_uri=http%3A%2F%2Feternal-twin.net%2Foauth%2Fcallback&scope=&state=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJhYWEiLCJhIjp7InR5cGUiOiJMb2dpbiJ9LCJpYXQiOjE2MDMzOTQ5MDIsImFzIjoidHdpbm9pZC5jb20iLCJleHAiOjE2MDMzOTU4MDJ9.Yt-BNBoGCdjEfmxlwUbfTp6Uv6ZNUQx0B2QmoL6yfX4&access_type=offline");

    chai.assert.strictEqual(actual.toString(), expected.toString());
  });
});
