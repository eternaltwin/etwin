import { $AuthContext, AuthContext } from "@eternal-twin/core/auth/auth-context";
import { $GetHammerfestUserOptions, GetHammerfestUserOptions } from "@eternal-twin/core/hammerfest/get-hammerfest-user-options";
import {
  $NullableHammerfestUser,
  NullableHammerfestUser
} from "@eternal-twin/core/hammerfest/hammerfest-user";
import { HammerfestService} from "@eternal-twin/core/hammerfest/service";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeHammerfestClient } from "../hammerfest-client.mjs";
import { NativeHammerfestStore } from "../hammerfest-store.mjs";
import { NativeLinkStore } from "../link-store.mjs";
import { NativeUserStore } from "../user-store.mjs";

declare const NativeHammerfestServiceBox: unique symbol;

export interface NativeHammerfestServiceOptions {
  hammerfestClient: NativeHammerfestClient;
  hammerfestStore: NativeHammerfestStore;
  linkStore: NativeLinkStore;
  userStore: NativeUserStore;
}

export class NativeHammerfestService implements HammerfestService {
  private static NEW = promisify(native.services.hammerfest.new);
  private static GET_USER = promisify(native.services.hammerfest.getUser);

  public readonly box: typeof NativeHammerfestServiceBox;

  private constructor(box: typeof NativeHammerfestServiceBox) {
    this.box = box;
  }

  public static async create(options: Readonly<NativeHammerfestServiceOptions>): Promise<NativeHammerfestService> {
    const box = await NativeHammerfestService.NEW(options.hammerfestClient.box, options.hammerfestStore.box, options.linkStore.box, options.userStore.box);
    return new NativeHammerfestService(box);
  }

  async getUser(acx: AuthContext, options: Readonly<GetHammerfestUserOptions>): Promise<NullableHammerfestUser> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $GetHammerfestUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeHammerfestService.GET_USER(this.box, rawAcx, rawOptions);
    return $NullableHammerfestUser.read(JSON_READER, rawOut);
  }
}
