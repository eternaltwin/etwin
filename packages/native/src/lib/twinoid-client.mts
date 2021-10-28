import {
  $RfcOauthAccessTokenKey,
  RfcOauthAccessTokenKey
} from "@eternal-twin/core/oauth/rfc-oauth-access-token-key";
import { TwinoidClient } from "@eternal-twin/core/twinoid/client";
import { TwinoidUser } from "@eternal-twin/core/twinoid/twinoid-user";
import { TwinoidUserDisplayName } from "@eternal-twin/core/twinoid/twinoid-user-display-name";
import { TwinoidUserId } from "@eternal-twin/core/twinoid/twinoid-user-id";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeClock } from "./clock.mjs";

declare const HttpTwinoidClientBox: unique symbol;
declare const MemTwinoidClientBox: unique symbol;
export type NativeTwinoidClientBox = typeof HttpTwinoidClientBox | typeof MemTwinoidClientBox;

export abstract class NativeTwinoidClient implements TwinoidClient {
  public readonly box: NativeTwinoidClientBox;
  private static GET_ME = promisify(native.twinoidClient.getMe);

  constructor(box: NativeTwinoidClientBox) {
    this.box = box;
  }

  async getMe(token: RfcOauthAccessTokenKey): Promise<{id: TwinoidUserId, displayName: TwinoidUserDisplayName}> {
    const rawOptions: string = $RfcOauthAccessTokenKey.write(JSON_WRITER, token);
    const rawOut = JSON.parse(await NativeTwinoidClient.GET_ME(this.box, rawOptions));
    return {
      id: String(rawOut.id),
      displayName: rawOut.name,
    };
  }

  getUser(_at: RfcOauthAccessTokenKey, _id: TwinoidUserId): Promise<TwinoidUser | null> {
    throw new Error("NotImplemented");
  }

  getUsers(_at: RfcOauthAccessTokenKey, _ids: readonly TwinoidUserId[]): Promise<TwinoidUser[]> {
    throw new Error("NotImplemented");
  }
}

export interface HttpTwinoidClientOptions {
  clock: NativeClock;
}

export class HttpTwinoidClient extends NativeTwinoidClient {
  constructor(options: Readonly<HttpTwinoidClientOptions>) {
    super(native.twinoidClient.http.new(options.clock.box));
  }
}
