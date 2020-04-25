import { IntegerType } from "kryo/lib/integer";

/**
 * A Hammerfest user id.
 */
export type HammerfestUserId = number;

export const $HammerfestUserId: IntegerType = new IntegerType({min: 0, max: 1000000000});
