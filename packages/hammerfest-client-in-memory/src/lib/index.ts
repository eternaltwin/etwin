import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestForumTheme } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme";
import { HammerfestForumThemePage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-theme-page";
import { HammerfestForumThreadPage } from "@eternal-twin/core/lib/hammerfest/hammerfest-forum-thread-page.js";
import { HammerfestGetProfileByIdOptions } from "@eternal-twin/core/lib/hammerfest/hammerfest-get-profile-by-id-options.js";
import { HammerfestGodChild } from "@eternal-twin/core/lib/hammerfest/hammerfest-god-child";
import { HammerfestItemCounts } from "@eternal-twin/core/lib/hammerfest/hammerfest-item-counts";
import { HammerfestLogin } from "@eternal-twin/core/lib/hammerfest/hammerfest-login.js";
import { HammerfestProfile } from "@eternal-twin/core/lib/hammerfest/hammerfest-profile";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestShop } from "@eternal-twin/core/lib/hammerfest/hammerfest-shop";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { Password } from "@eternal-twin/core/lib/password/password.js";

interface InMemoryServer {
  isAvailable: boolean;
  users: Map<HammerfestUserId, InMemoryUser>;
  sessions: Map<HammerfestSessionKey, InMemoryUser>;
}

interface InMemoryUser {
  id: HammerfestUserId;
  username: HammerfestLogin;
  password: Password;
  session: HammerfestSessionKey | null;
}

function makeSessionKey(): HammerfestSessionKey {
  const ALPHABET: string = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key: string = "";
  for (let i: number = 0; i < 26; i++) {
    key += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return key;
}

export class InMemoryHammerfestClientService implements HammerfestClientService {
  private readonly servers: Map<HammerfestServer, InMemoryServer>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.fr", {isAvailable: true, users: new Map(), sessions: new Map()}],
      ["hfest.net", {isAvailable: true, users: new Map(), sessions: new Map()}],
      ["hammerfest.es", {isAvailable: true, users: new Map(), sessions: new Map()}],
    ]);
  }

  async createSession(credentials: HammerfestCredentials): Promise<HammerfestSession> {
    const srv = this.getServer(credentials.server);
    for (const user of srv.users.values()) {
      if (user.username === credentials.login) {
        if (Buffer.from(user.password).toString("hex") !== Buffer.from(credentials.password).toString("hex")) {
          throw new Error("BadPassword");
        }
        if (user.session !== null) {
          srv.sessions.delete(user.session);
        }
        const key = makeSessionKey();
        user.session = key;
        srv.sessions.set(key, user);
        const ctime = new Date();
        const apiSession: HammerfestSession = {
          ctime,
          atime: ctime,
          key,
          user: {
            type: ObjectType.HammerfestUser,
            server: credentials.server,
            id: user.id,
            login: user.username,
          },
        };
        return apiSession;
      }
    }
    throw new Error("UserNotFound");
  }

  async testSession(server: HammerfestServer, key: HammerfestSessionKey): Promise<HammerfestSession | null> {
    const srv = this.getServer(server);
    const user: InMemoryUser | undefined = srv.sessions.get(key);
    if (user === undefined) {
      return null;
    }
    const ctime = new Date();
    return {
      ctime,
      atime: ctime,
      key,
      user: {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: user.id,
        login: user.username,
      },
    };
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

  public createUser(
    server: HammerfestServer,
    id: HammerfestUserId,
    username: HammerfestLogin,
    password: Password,
  ): void {
    const srv = this.getServer(server);
    if (srv.users.has(id)) {
      throw new Error("AssertionError: User id conflict");
    }
    srv.users.set(id, {id, username, password, session: null});
  }

  private getServer(server: HammerfestServer): InMemoryServer {
    const result: InMemoryServer | undefined = this.servers.get(server);
    if (result === undefined) {
      throw new Error(`HammerfestServerNotFound: ${server}`);
    }
    if (!result.isAvailable) {
      throw new Error(`ConnectionError: ${server}`);
    }
    return result;
  }
}
