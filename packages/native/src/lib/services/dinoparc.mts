import { $AuthContext, AuthContext } from "@eternal-twin/core/auth/auth-context";
import {
  $NullableEtwinDinoparcDinoz,
  NullableEtwinDinoparcDinoz
} from "@eternal-twin/core/dinoparc/etwin-dinoparc-dinoz";
import { $NullableEtwinDinoparcUser, NullableEtwinDinoparcUser } from "@eternal-twin/core/dinoparc/etwin-dinoparc-user";
import {
  $GetDinoparcDinozOptions,
  GetDinoparcDinozOptions
} from "@eternal-twin/core/dinoparc/get-dinoparc-dinoz-options";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/dinoparc/get-dinoparc-user-options";
import { DinoparcService } from "@eternal-twin/core/dinoparc/service";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeDinoparcStore } from "../dinoparc-store.mjs";
import { NativeLinkStore } from "../link-store.mjs";
import { NativeUserStore } from "../user-store.mjs";

declare const NativeDinoparcServiceBox: unique symbol;

export interface NativeDinoparcServiceOptions {
  dinoparcStore: NativeDinoparcStore;
  linkStore: NativeLinkStore;
  userStore: NativeUserStore;
}

export class NativeDinoparcService implements DinoparcService {
  private static NEW = promisify(native.services.dinoparc.new);
  private static GET_USER = promisify(native.services.dinoparc.getUser);
  private static GET_DINOZ = promisify(native.services.dinoparc.getDinoz);

  public readonly box: typeof NativeDinoparcServiceBox;

  private constructor(box: typeof NativeDinoparcServiceBox) {
    this.box = box;
  }

  public static async create(options: Readonly<NativeDinoparcServiceOptions>): Promise<NativeDinoparcService> {
    const box = await NativeDinoparcService.NEW(options.dinoparcStore.box, options.linkStore.box, options.userStore.box);
    return new NativeDinoparcService(box);
  }

  async getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableEtwinDinoparcUser> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcService.GET_USER(this.box, rawAcx, rawOptions);
    return $NullableEtwinDinoparcUser.read(JSON_READER, rawOut);
  }

  async getDinoz(acx: AuthContext, options: Readonly<GetDinoparcDinozOptions>): Promise<NullableEtwinDinoparcDinoz> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $GetDinoparcDinozOptions.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcService.GET_DINOZ(this.box, rawAcx, rawOptions);
    return $NullableEtwinDinoparcDinoz.read(JSON_READER, rawOut);
  }
}
