import { PasswordHash } from "@eternal-twin/etwin-api-types/lib/password/password-hash.js";
import { Password } from "@eternal-twin/etwin-api-types/lib/password/password.js";
import { PasswordService } from "@eternal-twin/etwin-api-types/lib/password/service.js";
import scryptKdf from "scrypt-kdf";

const DEFAULT_MAX_TIME_SECONDS: number = 1;

export class ScryptPasswordService implements PasswordService {
  private readonly params: scryptKdf.ScryptParams;

  /**
   * Creates a new password service using the scrypt algorithm.
   *
   * @param maxTimeSeconds Maximum time used by the key derivation function, in seconds
   * @param maxMemBytes Maximum memory used by the key derivation function, in bytes. Any value greater than
   *                    half of the total RAM is equivalent to half of the available RAM.
   *                    You can omit it to let `scrypt` determine the value automatically.
   */
  public constructor(maxTimeSeconds?: number, maxMemBytes?: number) {
    if (maxTimeSeconds === undefined) {
      maxTimeSeconds = DEFAULT_MAX_TIME_SECONDS;
    }
    this.params = scryptKdf.pickParams(maxTimeSeconds, maxMemBytes);
  }

  public async hash(clear: Password): Promise<Uint8Array> {
    return scryptKdf.kdf(clear, this.params);
  }

  public async verify(hash: PasswordHash, clear: Password): Promise<boolean> {
    return scryptKdf.verify(hash, clear);
  }
}
