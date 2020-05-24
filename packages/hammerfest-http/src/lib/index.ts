import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import hfApi from "@eternalfest/hammerfest-api";

export class HttpHammerfestService implements HammerfestService {
  private readonly servers: Map<HammerfestServer, string>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.fr", "http://www.hammerfest.fr/"],
      ["hfest.net", "http://www.hfest.net/"],
      ["hammerfest.es", "http://www.hammerfest.es/"],
    ]);
  }

  public async createSession(_auth: AuthContext, credentials: HammerfestCredentials): Promise<HammerfestSession> {
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
    _auth: AuthContext,
    _server: HammerfestServer,
    _key: HammerfestSessionKey,
  ): Promise<HammerfestSession> {
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
