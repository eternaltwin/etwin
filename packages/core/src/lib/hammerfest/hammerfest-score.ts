import { $Uint32, IntegerType } from "kryo/integer";

/**
 * A Hammerfest score.
 */
export type HammerfestScore = number;

export const $HammerfestScore: IntegerType = $Uint32;
