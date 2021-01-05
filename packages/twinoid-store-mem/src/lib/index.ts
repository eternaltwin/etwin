import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedTwinoidUser } from "@eternal-twin/core/lib/twinoid/archived-twinoid-user";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options.js";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { TwinoidUserDisplayName } from "@eternal-twin/core/lib/twinoid/twinoid-user-display-name.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";

interface MemServer {
  users: Map<TwinoidUserId, MemUser>;
}

interface MemUser {
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
  archivedAt: Date;
}

export class MemTwinoidStore implements TwinoidStore {
  private readonly server: MemServer;

  constructor() {
    this.server = {
      users: new Map(),
    };
  }

  public async getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null> {
    return this.getShortUser(options);
  }

  public async getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ArchivedTwinoidUser | null> {
    const srv = this.getServer();
    const user: MemUser | undefined = srv.users.get(options.id);
    if (user === undefined) {
      return null;
    }
    return {type: ObjectType.TwinoidUser, id: user.id, displayName: user.displayName, archivedAt: new Date(user.archivedAt)};
  }

  public async touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ArchivedTwinoidUser> {
    const srv = this.getServer();
    if (srv.users.has(short.id)) {
      throw new Error("AssertionError: User id conflict");
    }
    const mem = {id: short.id, displayName: short.displayName, archivedAt: new Date()};
    srv.users.set(short.id, mem);
    return {type: ObjectType.TwinoidUser, id: mem.id, displayName: mem.displayName, archivedAt: new Date(mem.archivedAt)};
  }

  private getServer(): MemServer {
    return this.server;
  }
}
