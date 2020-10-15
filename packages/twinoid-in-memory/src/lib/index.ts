import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service.js";
import { TwinoidUserDisplayName } from "@eternal-twin/core/lib/twinoid/twinoid-user-display-name.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import { TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";

interface InMemoryServer {
  isAvailable: boolean;
  users: Map<TwinoidUserId, InMemoryUser>;
}

interface InMemoryUser {
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
}

export class InMemoryTwinoidService implements TwinoidService {
  private readonly server: InMemoryServer;

  constructor() {
    this.server = {
      isAvailable: true,
      users: new Map(),
    };
  }

  async getUserById(_acx: AuthContext, userId: TwinoidUserId): Promise<TwinoidUserRef | null> {
    const srv = this.getServer();
    const user: InMemoryUser | undefined = srv.users.get(userId);
    if (user === undefined) {
      return null;
    }
    return {type: ObjectType.TwinoidUser, id: user.id, displayName: user.displayName};
  }

  public createUser(
    id: TwinoidUserId,
    displayName: TwinoidUserDisplayName,
  ): void {
    const srv = this.getServer();
    if (srv.users.has(id)) {
      throw new Error("AssertionError: User id conflict");
    }
    srv.users.set(id, {id, displayName});
  }

  private getServer(): InMemoryServer {
    if (!this.server.isAvailable) {
      throw new Error("ConnectionError");
    }
    return this.server;
  }
}
