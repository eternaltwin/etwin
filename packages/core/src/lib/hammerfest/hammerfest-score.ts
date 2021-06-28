import { $Uint32, IntegerType } from "kryo/lib/integer";

/**
 * A Hammerfest score.
 */
export type HammerfestScore = number;

export const $HammerfestScore: IntegerType = $Uint32;
