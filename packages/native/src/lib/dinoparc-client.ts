import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client";
import {
  $DinoparcCollectionResponse,
  DinoparcCollectionResponse
} from "@eternal-twin/core/lib/dinoparc/dinoparc-collection-response";
import {
  $DinoparcCredentials,
  DinoparcCredentials
} from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials";
import { $DinoparcDinozId, DinoparcDinozId } from "@eternal-twin/core/lib/dinoparc/dinoparc-dinoz-id";
import { $DinoparcDinozResponse, DinoparcDinozResponse } from "@eternal-twin/core/lib/dinoparc/dinoparc-dinoz-response";
import { $DinoparcExchangeWithResponse, DinoparcExchangeWithResponse } from "@eternal-twin/core/lib/dinoparc/dinoparc-exchange-with-response";
import {
  $DinoparcInventoryResponse,
  DinoparcInventoryResponse
} from "@eternal-twin/core/lib/dinoparc/dinoparc-inventory-response";
import { $DinoparcPassword, DinoparcPassword } from "@eternal-twin/core/lib/dinoparc/dinoparc-password";
import { $DinoparcServer, DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import {
  $DinoparcSession,
  $NullableDinoparcSession,
  DinoparcSession,
  NullableDinoparcSession
} from "@eternal-twin/core/lib/dinoparc/dinoparc-session";
import {
  $DinoparcSessionKey,
  DinoparcSessionKey
} from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key";
import { $DinoparcUserId, DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id";
import { $DinoparcUsername, DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username";
import { IoType } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { JSON_READER } from "kryo-json/lib/json-reader";
import { JSON_WRITER } from "kryo-json/lib/json-writer";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";

declare const HttpDinoparcClientBox: unique symbol;
declare const MemDinoparcClientBox: unique symbol;
export type NativeDinoparcClientBox = typeof HttpDinoparcClientBox | typeof MemDinoparcClientBox;

const $DinoparcUserIdPair: IoType<[DinoparcUserId, DinoparcUserId]> = new ArrayType({itemType: $DinoparcUserId, minLength: 2, maxLength: 2}) as unknown as IoType<[DinoparcUserId, DinoparcUserId]>;

export abstract class NativeDinoparcClient implements DinoparcClient {
  public readonly box: NativeDinoparcClientBox;
  private static GET_PREFERRED_EXCHANGE_WITH = promisify(native.dinoparcClient.getPreferredExchangeWith);
  private static CREATE_SESSION = promisify(native.dinoparcClient.createSession);
  private static TEST_SESSION = promisify(native.dinoparcClient.testSession);
  private static GET_EXCHANGE_WITH = promisify(native.dinoparcClient.getExchangeWith);
  private static GET_DINOZ = promisify(native.dinoparcClient.getDinoz);
  private static GET_INVENTORY = promisify(native.dinoparcClient.getInventory);
  private static GET_COLLECTION = promisify(native.dinoparcClient.getCollection);

  constructor(box: NativeDinoparcClientBox) {
    this.box = box;
  }

  async getPreferredExchangeWith(options: DinoparcServer): Promise<[DinoparcUserId, DinoparcUserId]> {
    const rawOptions: string = $DinoparcServer.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcClient.GET_PREFERRED_EXCHANGE_WITH(this.box, rawOptions);
    return $DinoparcUserIdPair.read(JSON_READER, rawOut);
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

  async getDinoz(session: DinoparcSession, dinozId: DinoparcDinozId): Promise<DinoparcDinozResponse> {
    const rawSession: string = $DinoparcSession.write(JSON_WRITER, session);
    const rawDinozId: string = $DinoparcDinozId.write(JSON_WRITER, dinozId);
    const rawOut = await NativeDinoparcClient.GET_DINOZ(this.box, rawSession, rawDinozId);
    return $DinoparcDinozResponse.read(JSON_READER, rawOut);
  }

  async getExchangeWith(session: DinoparcSession, otherUser: DinoparcUserId): Promise<DinoparcExchangeWithResponse> {
    const rawSession: string = $DinoparcSession.write(JSON_WRITER, session);
    const rawOtherUser: string = $DinoparcUserId.write(JSON_WRITER, otherUser);
    const rawOut = await NativeDinoparcClient.GET_EXCHANGE_WITH(this.box, rawSession, rawOtherUser);
    return $DinoparcExchangeWithResponse.read(JSON_READER, rawOut);
  }

  async getInventory(session: DinoparcSession): Promise<DinoparcInventoryResponse> {
    const rawSession: string = $DinoparcSession.write(JSON_WRITER, session);
    const rawOut = await NativeDinoparcClient.GET_INVENTORY(this.box, rawSession);
    return $DinoparcInventoryResponse.read(JSON_READER, rawOut);
  }

  async getCollection(session: DinoparcSession): Promise<DinoparcCollectionResponse> {
    const rawSession: string = $DinoparcSession.write(JSON_WRITER, session);
    const rawOut = await NativeDinoparcClient.GET_COLLECTION(this.box, rawSession);
    return $DinoparcCollectionResponse.read(JSON_READER, rawOut);
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
