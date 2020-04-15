import { UuidHex } from "./uuid-hex.js";

/**
 * Infinite UUID generator.
 */
export interface UuidGenerator {
  next(): UuidHex;
}
