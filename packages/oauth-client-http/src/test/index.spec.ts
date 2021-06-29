import { Url } from "@eternal-twin/core/lib/core/url";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service";
import { EtwinOauthActionType } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-action-type";
import { VirtualClock } from "@eternal-twin/native/lib/clock";
import chai from "chai";

import { HttpOauthClientService } from "../lib/index.js";

describe("HttpOauthClientService", () => {
  it("can be instantiated", async () => {
    const clock = new VirtualClock();
    const twinoid: OauthClientService = new HttpOauthClientService({
      authorizationUri: new Url("http://twinoid.com/oauth/auth"),
      callbackUri: new Url("http://eternal-twin.net/oauth/callback"),
      clientId: "380",
      clientSecret: "aaaa",
      grantUri: new Url("http://twinoid.com/oauth/token"),
      tokenSecret: Buffer.from("dev_secret"),
      clock,
    });
    chai.assert.isDefined(twinoid);
  });

  it("create an authorization request", async () => {
    const clock = new VirtualClock();
    const twinoid: OauthClientService = new HttpOauthClientService({
      authorizationUri: new Url("http://twinoid.com/oauth/auth"),
      callbackUri: new Url("http://eternal-twin.net/oauth/callback"),
      clientId: "380",
      clientSecret: "aaaa",
      grantUri: new Url("http://twinoid.com/oauth/token"),
      tokenSecret: Buffer.from("dev_secret"),
      clock,
    });

    const actual: Url = await twinoid.createAuthorizationRequest(
      {
        requestForgeryProtection: "aaa",
        action: {
          type: EtwinOauthActionType.Login,
        },
      },
      []
    );
    const expected = new Url("http://twinoid.com/oauth/auth?response_type=code&client_id=380&redirect_uri=http%3A%2F%2Feternal-twin.net%2Foauth%2Fcallback&scope=&state=%5B%7B%22alg%22%3A%22HS256%22%2C%22typ%22%3A%22JWT%22%7D%2C%7B%22rfp%22%3A%22aaa%22%2C%22a%22%3A%7B%22type%22%3A%22Login%22%7D%2C%22iat%22%3A1603394902%2C%22as%22%3A%22twinoid.com%22%2C%22exp%22%3A1603395802%7D%2C%22Yt-BNBoGCdjEfmxlwUbfTp6Uv6ZNUQx0B2QmoL6yfX4%22%5D&access_type=offline");

    chai.assert.strictEqual(actual.toString(), expected.toString());
  });

  it("checks state limits", async () => {
    const clock = new VirtualClock();
    const twinoid = new HttpOauthClientService({
      authorizationUri: new Url("http://twinoid.com/oauth/auth"),
      callbackUri: new Url("http://eternal-twin.net/oauth/callback"),
      clientId: "380",
      clientSecret: "aaaa",
      grantUri: new Url("http://twinoid.com/oauth/token"),
      tokenSecret: Buffer.from("dev_secret"),
      clock,
    });
    {
      const states: readonly string[] = [
        "[{\"alg\":\"HS256\",\"typ\":\"JWT\"},{\"rfp\":\"aaa\",\"a\":{\"type\":\"Login\"},\"iat\":1603394902,\"as\":\"twinoid.com\",\"exp\":1603395802},\"Yt-BNBoGCdjEfmxlwUbfTp6Uv6ZNUQx0B2QmoL6yfX4\"]",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJhYWEiLCJhIjp7InR5cGUiOiJMb2dpbiJ9LCJpYXQiOjE2MDMzOTQ5MDIsImFzIjoidHdpbm9pZC5jb20iLCJleHAiOjE2MDMzOTU4MDJ9.Yt-BNBoGCdjEfmxlwUbfTp6Uv6ZNUQx0B2QmoL6yfX4",
      ];
      for (const [i, state] of states.entries()) {
        const isValid: boolean = await twinoid.testLimits({state});
        chai.assert.isTrue(isValid, `Valid #${i}`);
      }
    }
    {
      const states: readonly string[] = [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZnAiOiJUT0RPIiwiYSI6eyJ0eXBlIjoiTGluayIsInVzZXJfaWQiOiJjNzI1YzQzNC0wM2ZhLTRlY2MtYmQ3Zi1iOTllMDAyZTljZWUifSwiaWF0IjoxNjAzNDU4NjYyLCJhcyI6InR3aW5vaWQuY29tIiwiZXhwIjoxNjAzNDU5NTYyfQ.uJXsgU0wPYRYDg_3NzbOEHMWlOQ6r4hk6-0lh8s40X8",
        "\x1BÓ\x00`\x1C\x07v,³\x89t0í>ép[©_F6\x87þ¢\x86Û·\x0EKWß\x14\x89ÙÓÉ\x81\x1EP\x7FÁß\x9A\x07\x81a\x18`à!\x0BQ¾Q\x84b\x7FÝ;t\x80Ñ\x96p\x01)»\x14\x98\x1Cwð\x96ÛÒE¿#o0P\x16\x90kH\x8B\x17Oï\x07|%á_F\x99\x8A¨ýV\x99õýª\x9F\x9F´Õ\x8FiZ\b\x11ËüZ\x16<Þ»\x04\tD\x197\x84 \x8Aw\x01l/\x89÷[PÇjS\b&§í¶\x9A\x9C\ng\x8F\x9AÕysî9Oºø\x7F\x96ýÑü\x18.×\"gn T\x14ºFÁÐÉ\x80\x01",
      ];
      for (const [i, state] of states.entries()) {
        const isValid: boolean = await twinoid.testLimits({state});
        chai.assert.isFalse(isValid, `Invalid #${i}`);
      }
    }
  });
});
