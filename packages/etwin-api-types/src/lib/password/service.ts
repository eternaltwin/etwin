import { PasswordHash } from "./password-hash.js";
import { Password } from "./password.js";

export interface PasswordService {
  /**
   * Convert a password's clear text into a hash.
   *
   * @param clearText Password clear text (the actual password)
   * @returns Password hash, a value that can be used to verify if subsequent
   * passwords correspond to the one used to generate this hash.
   */
  hash(clearText: Password): Promise<PasswordHash>;

  /**
   * Verifies if the hash and password match.
   *
   * @param hash Password hash generated when setting the original password.
   * @param clearText Clear text to match
   * @returns Boolean indicating if the provided clear text password corresponds
   * to the one used to generate `hash`.
   */
  verify(hash: PasswordHash, clearText: Password): Promise<boolean>;
}
