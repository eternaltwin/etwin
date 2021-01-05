import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedHammerfestUser } from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user";
import { GetHammerfestUserOptions } from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id.js";
import { HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username.js";
import { ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";

interface MemHammerfestUser {
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
  archivedAt: Date;
}

interface MemHammerfestDataByServer {
  users: Map<HammerfestUserId, MemHammerfestUser>;
}

export class MemHammerfestStore implements HammerfestStore {
  private readonly servers: Map<HammerfestServer, MemHammerfestDataByServer>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.es", {users: new Map()}],
      ["hammerfest.fr", {users: new Map()}],
      ["hfest.net", {users: new Map()}],
    ]);
  }

  async getUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    return this.getShortUser(options);
  }

  async getShortUser(options: Readonly<GetHammerfestUserOptions>): Promise<ArchivedHammerfestUser | null> {
    const server = this.getImServerData(options.server);
    const user: MemHammerfestUser | undefined = server.users.get(options.id);
    if (user === undefined) {
      return null;
    }
    return {
      type: ObjectType.HammerfestUser,
      server: user.server,
      id: user.id,
      username: user.username,
      archivedAt: new Date(user.archivedAt),
    };
  }

  async touchShortUser(ref: Readonly<ShortHammerfestUser>): Promise<ArchivedHammerfestUser> {
    const server = this.getImServerData(ref.server);
    let user: MemHammerfestUser | undefined = server.users.get(ref.id);
    if (user === undefined) {
      user = {
        server: ref.server,
        id: ref.id,
        username: ref.username,
        archivedAt: new Date(),
      };
      server.users.set(ref.id, user);
    }
    return {
      type: ObjectType.HammerfestUser,
      server: user.server,
      id: user.id,
      username: user.username,
      archivedAt: new Date(user.archivedAt),
    };
  }

  private getImServerData(server: HammerfestServer): MemHammerfestDataByServer {
    const data: MemHammerfestDataByServer | undefined = this.servers.get(server);
    if (data === undefined) {
      throw new Error(`AssertionError: Unexpected server: ${server}`);
    }
    return data;
  }
}
