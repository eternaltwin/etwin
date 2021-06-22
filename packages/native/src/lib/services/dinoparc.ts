import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { $NullableDinoparcUser, NullableDinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user.js";
import {
  $GetDinoparcUserOptions,
  GetDinoparcUserOptions
} from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options.js";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service.js";
import { JSON_READER } from "kryo-json/lib/json-reader.js";
import { JSON_WRITER } from "kryo-json/lib/json-writer.js";
import { promisify } from "util";

import native from "../../native/index.js";
import { NativeDinoparcStore } from "../dinoparc-store.js";
import { NativeLinkStore } from "../link-store.js";
import { NativeUserStore } from "../user-store.js";

declare const NativeDinoparcServiceBox: unique symbol;

export interface NativeDinoparcServiceOptions {
  dinoparcStore: NativeDinoparcStore;
  linkStore: NativeLinkStore;
  userStore: NativeUserStore;
}

export class NativeDinoparcService implements DinoparcService {
  private static NEW = promisify(native.services.dinoparc.new);
  private static GET_USER = promisify(native.services.dinoparc.getUser);

  public readonly box: typeof NativeDinoparcServiceBox;

  private constructor(box: typeof NativeDinoparcServiceBox) {
    this.box = box;
  }

  public static async create(options: Readonly<NativeDinoparcServiceOptions>): Promise<NativeDinoparcService> {
    const box = await NativeDinoparcService.NEW(options.dinoparcStore.box, options.linkStore.box, options.userStore.box);
    return new NativeDinoparcService(box);
  }

  async getUser(acx: AuthContext, options: Readonly<GetDinoparcUserOptions>): Promise<NullableDinoparcUser> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $GetDinoparcUserOptions.write(JSON_WRITER, options);
    const rawOut = await NativeDinoparcService.GET_USER(this.box, rawAcx, rawOptions);
    return $NullableDinoparcUser.read(JSON_READER, rawOut);
  }
}
