import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client.js";
import { DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import { DinoparcPassword } from "@eternal-twin/core/lib/dinoparc/dinoparc-password.js";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import { DinoparcSessionKey } from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key.js";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";

interface MemServer {
  isAvailable: boolean;
  users: Map<DinoparcUserId, MemUser>;
  sessions: Map<DinoparcSessionKey, MemUser>;
}

interface MemUser {
  id: DinoparcUserId;
  username: DinoparcUsername;
  password: DinoparcPassword;
  session: DinoparcSessionKey | null;
}

function makeSessionKey(): DinoparcSessionKey {
  const ALPHABET: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key: string = "";
  for (let i: number = 0; i < 32; i++) {
    key += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return key;
}

export class MemDinoparcClient implements DinoparcClient {
  readonly #servers: Map<DinoparcServer, MemServer>;

  constructor() {
    this.#servers = new Map([
      ["dinoparc.com", {isAvailable: true, users: new Map(), sessions: new Map()}],
      ["en.dinoparc.com", {isAvailable: true, users: new Map(), sessions: new Map()}],
      ["sp.dinoparc.com", {isAvailable: true, users: new Map(), sessions: new Map()}],
    ]);
  }

  async createSession(credentials: DinoparcCredentials): Promise<DinoparcSession> {
    const srv = this.getServer(credentials.server);
    for (const user of srv.users.values()) {
      if (user.username === credentials.username) {
        if (user.password !== credentials.password) {
          throw new Error("BadPassword");
        }
        if (user.session !== null) {
          srv.sessions.delete(user.session);
        }
        const key = makeSessionKey();
        user.session = key;
        srv.sessions.set(key, user);
        const ctime = new Date();
        const apiSession: DinoparcSession = {
          ctime,
          atime: ctime,
          key,
          user: {
            type: ObjectType.DinoparcUser,
            server: credentials.server,
            id: user.id,
            username: user.username,
          },
        };
        return apiSession;
      }
    }
    throw new Error("UserNotFound");
  }

  public async createUser(
    server: DinoparcServer,
    id: DinoparcUserId,
    username: DinoparcUsername,
    password: DinoparcPassword,
  ): Promise<void> {
    const srv = this.getServer(server);
    if (srv.users.has(id)) {
      throw new Error("AssertionError: User id conflict");
    }
    srv.users.set(id, {id, username, password, session: null});
  }

  private getServer(server: DinoparcServer): MemServer {
    const result: MemServer | undefined = this.#servers.get(server);
    if (result === undefined) {
      throw new Error(`DinoparcServerNotFound: ${server}`);
    }
    if (!result.isAvailable) {
      throw new Error(`ConnectionError: ${server}`);
    }
    return result;
  }
}
