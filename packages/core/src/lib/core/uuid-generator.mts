import { UuidHex } from "./uuid-hex.mjs";

/**
 * Infinite UUID generator.
 */
export interface UuidGenerator {
  next(): UuidHex;
}
