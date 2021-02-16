import { Password } from "@eternal-twin/core/lib/password/password";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { promisify } from "util";

import native from "../native/index.js";

declare const ScryptPasswordServiceBox: unique symbol;
export type NativePasswordServiceBox = typeof ScryptPasswordServiceBox;

export abstract class NativePasswordService implements PasswordService {
  public readonly box: NativePasswordServiceBox;
  private static HASH = promisify(native.password.hash);
  private static VERIFY = promisify(native.password.verify);

  constructor(box: NativePasswordServiceBox) {
    this.box = box;
  }

  async hash(clearText: Password): Promise<PasswordHash> {
    const rawOut = await NativePasswordService.HASH(this.box, Buffer.from(clearText));
    return rawOut;
  }

  async verify(hash: PasswordHash, clearText: Password): Promise<boolean> {
    const rawOut = await NativePasswordService.VERIFY(this.box, Buffer.from(hash), Buffer.from(clearText));
    return rawOut;
  }
}

export class ScryptPasswordService extends NativePasswordService {
  private constructor(box: typeof ScryptPasswordServiceBox) {
    super(box);
  }

  public static recommendedForTests(): ScryptPasswordService {
    return new ScryptPasswordService(native.password.scrypt.recommendedForTests());
  }

  public static withOsRng(maxTime = 1.0, maxMemFrac = 0.5): ScryptPasswordService {
    return new ScryptPasswordService(native.password.scrypt.withOsRng(maxTime, maxMemFrac));
  }
}
