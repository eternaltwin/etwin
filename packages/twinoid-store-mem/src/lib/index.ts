import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options.js";
import { $ShortTwinoidUser, ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import { TwinoidUserDisplayName } from "@eternal-twin/core/lib/twinoid/twinoid-user-display-name.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";

interface InMemoryServer {
  users: Map<TwinoidUserId, InMemoryUser>;
}

interface InMemoryUser {
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
}

export class MemTwinoidStore implements TwinoidStore {
  private readonly server: InMemoryServer;

  constructor() {
    this.server = {
      users: new Map(),
    };
  }

  public async getUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    return this.getShortUser(options);
  }

  public async getShortUser(options: Readonly<GetTwinoidUserOptions>): Promise<ShortTwinoidUser | null> {
    const srv = this.getServer();
    const user: InMemoryUser | undefined = srv.users.get(options.id);
    if (user === undefined) {
      return null;
    }
    return {type: ObjectType.TwinoidUser, id: user.id, displayName: user.displayName};
  }

  public async touchShortUser(short: Readonly<ShortTwinoidUser>): Promise<ShortTwinoidUser> {
    const srv = this.getServer();
    if (srv.users.has(short.id)) {
      throw new Error("AssertionError: User id conflict");
    }
    srv.users.set(short.id, {id: short.id, displayName: short.displayName});
    return $ShortTwinoidUser.clone(short);
  }

  private getServer(): InMemoryServer {
    return this.server;
  }
}
