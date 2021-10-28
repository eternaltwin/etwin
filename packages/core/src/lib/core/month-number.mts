import { IntegerType } from "kryo/integer";

/**
 * ISO 8601 month number
 *
 * January is 1, February is 2, ... December is 12.
 */
export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const $MonthNumber: IntegerType = new IntegerType({min: 1, max: 12});
