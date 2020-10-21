import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserDisplayName } from "@eternal-twin/core/lib/twinoid/twinoid-user-display-name.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { $TwinoidUserRef, TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";

interface InMemoryServer {
  users: Map<TwinoidUserId, InMemoryUser>;
}

interface InMemoryUser {
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
}

export class InMemoryTwinoidArchiveService implements TwinoidArchiveService {
  private readonly server: InMemoryServer;

  constructor() {
    this.server = {
      users: new Map(),
    };
  }

  public async getUserById(tidUserId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    return this.getUserRefById(tidUserId);
  }

  public async getUserRefById(tidUserId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    const srv = this.getServer();
    const user: InMemoryUser | undefined = srv.users.get(tidUserId);
    if (user === undefined) {
      return null;
    }
    return {type: ObjectType.TwinoidUser, id: user.id, displayName: user.displayName};
  }

  public async createOrUpdateUserRef(ref: TwinoidUserRef): Promise<TwinoidUserRef> {
    const srv = this.getServer();
    if (srv.users.has(ref.id)) {
      throw new Error("AssertionError: User id conflict");
    }
    srv.users.set(ref.id, {id: ref.id, displayName: ref.displayName});
    return $TwinoidUserRef.clone(ref);
  }

  private getServer(): InMemoryServer {
    return this.server;
  }
}
