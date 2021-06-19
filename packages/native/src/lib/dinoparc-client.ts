import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client.js";
import {
  $DinoparcCredentials,
  DinoparcCredentials
} from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import { $DinoparcPassword, DinoparcPassword } from "@eternal-twin/core/lib/dinoparc/dinoparc-password.js";
import { $DinoparcServer, DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import {
  $DinoparcSession,
  $NullableDinoparcSession,
  DinoparcSession,
  NullableDinoparcSession
} from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import {
  $DinoparcSessionKey,
  DinoparcSessionKey
} from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key.js";
import { $DinoparcUserId, DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id.js";
import { $DinoparcUsername, DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";

declare const HttpDinoparcClientBox: unique symbol;
declare const MemDinoparcClientBox: unique symbol;
export type NativeDinoparcClientBox = typeof HttpDinoparcClientBox | typeof MemDinoparcClientBox;

export abstract class NativeDinoparcClient implements DinoparcClient {
  public readonly box: NativeDinoparcClientBox;
  private static CREATE_SESSION = promisify(native.dinoparcClient.createSession);
  private static TEST_SESSION = promisify(native.dinoparcClient.testSession);

  constructor(box: NativeDinoparcClientBox) {
    this.box = box;
  }

  async createSession(options: DinoparcCredentials): Promise<DinoparcSession> {
    const rawOptions: string = $DinoparcCredentials.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcClient.CREATE_SESSION(this.box, rawOptions);
    return $DinoparcSession.read(JSON_READER, rawOut);
  }

  async testSession(server: DinoparcServer, key: DinoparcSessionKey): Promise<NullableDinoparcSession> {
    const rawServer: string = $DinoparcServer.write(JSON_WRITER, server);
    const rawKey: string = $DinoparcSessionKey.write(JSON_WRITER, key);
    const rawOut = await NativeDinoparcClient.TEST_SESSION(this.box, rawServer, rawKey);
    return $NullableDinoparcSession.read(JSON_READER, rawOut);
  }
}

export interface HttpDinoparcClientOptions {
  clock: NativeClock;
}

export class HttpDinoparcClient extends NativeDinoparcClient {
  constructor(options: Readonly<HttpDinoparcClientOptions>) {
    super(native.dinoparcClient.http.new(options.clock.box));
  }
}

export interface MemDinoparcClientOptions {
  clock: NativeClock;
}

export class MemDinoparcClient extends NativeDinoparcClient {
  constructor(options: Readonly<MemDinoparcClientOptions>) {
    super(native.dinoparcClient.mem.new(options.clock.box));
  }

  async createUser(server: DinoparcServer, userId: DinoparcUserId, username: DinoparcUsername, password: DinoparcPassword): Promise<void> {
    const rawServer: string = $DinoparcServer.write(JSON_WRITER, server);
    const rawUserId: string = $DinoparcUserId.write(JSON_WRITER, userId);
    const rawUsername: string = $DinoparcUsername.write(JSON_WRITER, username);
    const rawPassword: string = $DinoparcPassword.write(JSON_WRITER, password);
    await native.dinoparcClient.mem.createUser(this.box, rawServer, rawUserId, rawUsername, rawPassword);
  }
}