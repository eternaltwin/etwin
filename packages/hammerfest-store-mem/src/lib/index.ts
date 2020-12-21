import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { GetHammerfestUserOptions } from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import { ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";

interface InMemoryHammerfestUser {
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
}

interface InMemoryHammerfestDataByServer {
  users: Map<HammerfestUserId, InMemoryHammerfestUser>;
}

export class MemHammerfestStore implements HammerfestStore {
  private readonly servers: Map<HammerfestServer, InMemoryHammerfestDataByServer>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.es", {users: new Map()}],
      ["hammerfest.fr", {users: new Map()}],
      ["hfest.net", {users: new Map()}],
    ]);
  }

  async getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null> {
    return this.getShortUser(options);
  }

  async getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ShortHammerfestUser | null> {
    const server = this.getImServerData(options.server);
    const user: InMemoryHammerfestUser | undefined = server.users.get(options.id);
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

  async touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ShortHammerfestUser> {
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
