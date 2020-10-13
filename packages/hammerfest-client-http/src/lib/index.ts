import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestTimeoutError } from "@eternal-twin/core/lib/hammerfest/errors/hammerfest-timeout.js";
import { HammerfestUnknownError } from "@eternal-twin/core/lib/hammerfest/errors/hammerfest-unknown.js";
import { InvalidHammerfestCredentialsError } from "@eternal-twin/core/lib/hammerfest/errors/invalid-hammerfest-credentials.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestForumThemePage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-page.js";
import { HammerfestForumTheme } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme.js";
import { HammerfestForumThreadPage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-thread-page.js";
import { HammerfestGetProfileByIdOptions } from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options.js";
import { HammerfestGodChild } from "@eternal-twin/core/lib/hammerfest/hammerfest-god-child.js";
import { HammerfestItemCounts } from "@eternal-twin/core/lib/hammerfest/hammerfest-item-counts.js";
import { $HammerfestLogin } from "@eternal-twin/core/lib/hammerfest/hammerfest-login.js";
import { HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestShop } from "@eternal-twin/core/lib/hammerfest/hammerfest-shop.js";
import { $Password } from "@eternal-twin/core/lib/password/password.js";
import { Cookie, CookieAccessInfo } from "cookiejar";
import { performance } from "perf_hooks";
import superagent from "superagent";

import { HammerfestSessionCookieNotFound } from "./errors/hammerfest-session-cookie-not-found.js";
import { UnexpectedHammerfestLoginRedirection } from "./errors/unexpected-hammerfest-login-redirection.js";
import { UnexpectedStatusCode } from "./errors/unexpected-status-code.js";
import { scrapeLogin } from "./scraping/login.js";
import { scrapePlay } from "./scraping/play.js";
import { HammerfestUri } from "./uri.js";

export class HttpHammerfestClientService implements HammerfestClientService {
  private readonly uri: HammerfestUri;

  constructor() {
    this.uri = new HammerfestUri();
  }

  public async createSession(credentials: HammerfestCredentials): Promise<HammerfestSession> {
    const TIMEOUT: number = 5000;
    try {
      return await this.innerCreateSession(credentials, TIMEOUT);
    } catch (e) {
      if (
        (e instanceof HammerfestTimeoutError)
        || (e instanceof HammerfestUnknownError)
        || (e instanceof InvalidHammerfestCredentialsError)
      ) {
        throw e;
      } else {
        if (e.errno === "ETIME" || e.errno === "ETIMEDOUT") {
          throw new HammerfestTimeoutError({server: credentials.server, timeout: TIMEOUT});
        }
        throw new HammerfestUnknownError({server: credentials.server, cause: e});
      }
    }
  }

  private async innerCreateSession(credentials: HammerfestCredentials, timeout: number): Promise<HammerfestSession> {
    if (!$HammerfestLogin.test(credentials.login) || !$Password.test(credentials.password)) {
      throw new InvalidHammerfestCredentialsError({server: credentials.server, login: credentials.login});
    }

    const loginUri = this.uri.login(credentials.server);
    const ctime = new Date();
    const startTime: number = performance.now();
    const agent = superagent.agent();
    const passwordStr: string = Buffer.from(credentials.password).toString("utf-8");
    const loginRes = await agent.post(loginUri.toString())
      .type("application/x-www-form-urlencoded")
      .timeout(timeout)
      .redirects(0)
      .ok(() => true)
      .send({login: credentials.login, pass: passwordStr});

    switch (loginRes.status) {
      case 302: {
        const sessionCookie: Cookie | undefined = agent.jar.getCookie("SID", new CookieAccessInfo(loginUri.host));
        if (sessionCookie === undefined) {
          throw new HammerfestSessionCookieNotFound();
        }
        if (loginRes.headers.location !== "/play.html#play") {
          throw new UnexpectedHammerfestLoginRedirection(loginRes.headers.location);
        }
        const remainingTime: number = Math.max(1, timeout - (performance.now() - startTime));
        const playUri = this.uri.play(credentials.server);
        const playRes = await agent.get(playUri.toString()).timeout(remainingTime);
        if (playRes.status !== 200) {
          throw new UnexpectedStatusCode(playRes.status, new Set([200, 302]), "GET", playUri);
        }
        const play = await scrapePlay(playRes.text);
        if (play.context.self === null) {
          throw new Error("ImmediatelyRevokedSession");
        }
        if (play.context.server !== credentials.server) {
          throw new Error(`UnexpectedLoginServer: actual: ${play.context.server}, expected: ${credentials.server}`);
        }
        const session: HammerfestSession = {
          ctime,
          atime: ctime,
          key: sessionCookie.value,
          user: {
            type: ObjectType.HammerfestUser,
            server: play.context.server,
            id: play.context.self.id,
            login: play.context.self.login,
          },
        };
        return session;
      }
      case 200: {
        const loginPage = await scrapeLogin(loginRes.text);
        if (loginPage.isError) {
          throw new InvalidHammerfestCredentialsError({server: credentials.server, login: credentials.login});
        }
        throw new Error("UnexpectedLoginResponse");
      }
      default:
        throw new UnexpectedStatusCode(loginRes.status, new Set([200, 302]), "POST", loginUri);
    }
  }

  public async testSession(
    _server: HammerfestServer,
    _key: HammerfestSessionKey,
  ): Promise<HammerfestSession> {
    throw new Error("NotImplemented");
  }

  async getProfileById(_session: HammerfestSession | null, _options: HammerfestGetProfileByIdOptions): Promise<HammerfestProfile> {
    throw new Error("NotImplemented");
  }

  async getOwnItems(_session: HammerfestSession): Promise<HammerfestItemCounts> {
    throw new Error("NotImplemented");
  }

  async getOwnGodChildren(_session: HammerfestSession): Promise<HammerfestGodChild[]> {
    throw new Error("NotImplemented");
  }

  async getOwnShop(_session: HammerfestSession): Promise<HammerfestShop> {
    throw new Error("NotImplemented");
  }

  async getForumThemes(_session: HammerfestSession | null, _server: HammerfestServer): Promise<HammerfestForumTheme[]> {
    throw new Error("NotImplemented");
  }

  async getForumThemePage(_session: HammerfestSession | null, _server: HammerfestServer, _themeId: string, _page1: number): Promise<HammerfestForumThemePage> {
    throw new Error("NotImplemented");
  }

  async getForumThreadPage(_session: HammerfestSession | null, _server: HammerfestServer, _themeId: string, _page1: number): Promise<HammerfestForumThreadPage> {
    throw new Error("NotImplemented");
  }
}
