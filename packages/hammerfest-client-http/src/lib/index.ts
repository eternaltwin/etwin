import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestForumThemePage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-page.js";
import { HammerfestForumTheme } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme.js";
import { HammerfestForumThreadPage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-thread-page.js";
import { HammerfestGodChild } from "@eternal-twin/core/lib/hammerfest/hammerfest-god-child.js";
import { HammerfestItemCounts } from "@eternal-twin/core/lib/hammerfest/hammerfest-item-counts.js";
import { HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestShop } from "@eternal-twin/core/lib/hammerfest/hammerfest-shop.js";
import hfApi from "@eternalfest/hammerfest-api";

export class HttpHammerfestClientService implements HammerfestClientService {
  private readonly servers: Map<HammerfestServer, string>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.fr", "http://www.hammerfest.fr/"],
      ["hfest.net", "http://www.hfest.net/"],
      ["hammerfest.es", "http://www.hammerfest.es/"],
    ]);
  }

  public async createSession(credentials: HammerfestCredentials): Promise<HammerfestSession> {
    const server: string = this.getServer(credentials.server);
    const password: string = Buffer.from(credentials.password).toString("utf-8");
    const {key, userId} = await hfApi.DEFAULT_HAMMERFEST_API.createSession({
      server,
      username: credentials.login,
      password,
    });
    const ctime = new Date();
    const session: HammerfestSession = {
      ctime,
      atime: ctime,
      key,
      user: {
        type: ObjectType.HammerfestUser,
        server: credentials.server,
        id: parseInt(userId),
        login: credentials.login,
      },
    };
    return session;
  }

  public async testSession(
    _server: HammerfestServer,
    _key: HammerfestSessionKey,
  ): Promise<HammerfestSession> {
    throw new Error("NotImplemented");
  }

  async getProfileById(_session: HammerfestSession | null, _server: HammerfestServer, _hfUserId: number): Promise<HammerfestProfile> {
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

  private getServer(server: HammerfestServer): string {
    const locale: string | undefined = this.servers.get(server);
    if (locale === undefined) {
      throw new Error(`UnknownServer: ${server}`);
    }
    return locale;
  }
}
