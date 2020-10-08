import { IntegerType } from "kryo/lib/integer.js";

/**
 * A Hammerfest score.
 */
export type HammerfestLevel = number;

export const $HammerfestLevel: IntegerType = new IntegerType({min: 0, max: 115});
