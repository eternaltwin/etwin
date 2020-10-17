import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";

interface InMemoryHammerfestUser {
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
}

interface InMemoryHammerfestDataByServer {
  users: Map<HammerfestUserId, InMemoryHammerfestUser>;
}

export class InMemoryHammerfestService implements HammerfestService {
  private readonly servers: Map<HammerfestServer, InMemoryHammerfestDataByServer>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.es", {users: new Map()}],
      ["hammerfest.fr", {users: new Map()}],
      ["hfest.net", {users: new Map()}],
    ]);
  }

  async getUserById(acx: AuthContext, server: HammerfestServer, userId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    return this.getUserRefById(acx, server, userId);
  }

  async getUserRefById(_acx: AuthContext, hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<HammerfestUserRef | null> {
    const server = this.getImServerData(hfServer);
    const user: InMemoryHammerfestUser | undefined = server.users.get(hfUserId);
    if (user === undefined) {
      return null;
    }
    return {
      type: ObjectType.HammerfestUser,
      server: user.server,
      id: user.id,
      username: user.username,
    };
  }

  async createOrUpdateUserRef(_acx: AuthContext, ref: HammerfestUserRef): Promise<HammerfestUserRef> {
    const server = this.getImServerData(ref.server);
    let user: InMemoryHammerfestUser | undefined = server.users.get(ref.id);
    if (user === undefined) {
      user = {
        server: ref.server,
        id: ref.id,
        username: ref.username,
      };
      server.users.set(ref.id, user);
    }
    return {
      type: ObjectType.HammerfestUser,
      server: user.server,
      id: user.id,
      username: user.username,
    };
  }

  private getImServerData(server: HammerfestServer): InMemoryHammerfestDataByServer {
    const data: InMemoryHammerfestDataByServer | undefined = this.servers.get(server);
    if (data === undefined) {
      throw new Error(`AssertionError: Unexpected server: ${server}`);
    }
    return data;
  }
}
