import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import { ShortDinoparcUser } from "@eternal-twin/core/lib/dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store";

interface MemDinoparcUser {
  server: DinoparcServer;
  id: DinoparcUserId;
  username: DinoparcUsername;
}

interface MemDinoparcDataByServer {
  users: Map<DinoparcUserId, MemDinoparcUser>;
}

export class MemDinoparcStore implements DinoparcStore {
  readonly #servers: ReadonlyMap<DinoparcServer, MemDinoparcDataByServer>;

  constructor() {
    this.#servers = new Map([
      ["dinoparc.com", {users: new Map()}],
      ["en.dinoparc.com", {users: new Map()}],
      ["sp.dinoparc.com", {users: new Map()}],
    ]);
  }

  async getShortUser(options: Readonly<GetDinoparcUserOptions>): Promise<ShortDinoparcUser | null> {
    const server = this.getMemServerData(options.server);
    const user: MemDinoparcUser | undefined = server.users.get(options.id);
    if (user === undefined) {
      return null;
    }
    return {
      type: ObjectType.DinoparcUser,
      server: user.server,
      id: user.id,
      username: user.username,
    };
  }

  async touchShortUser(short: Readonly<ShortDinoparcUser>): Promise<ShortDinoparcUser> {
    const server = this.getMemServerData(short.server);
    let user: MemDinoparcUser | undefined = server.users.get(short.id);
    if (user === undefined) {
      user = {
        server: short.server,
        id: short.id,
        username: short.username,
      };
      server.users.set(short.id, user);
    }
    return {
      type: ObjectType.DinoparcUser,
      server: user.server,
      id: user.id,
      username: user.username,
    };
  }

  private getMemServerData(server: DinoparcServer): MemDinoparcDataByServer {
    const data: MemDinoparcDataByServer | undefined = this.#servers.get(server);
    if (data === undefined) {
      throw new Error(`AssertionError: Unexpected server: ${server}`);
    }
    return data;
  }
}
