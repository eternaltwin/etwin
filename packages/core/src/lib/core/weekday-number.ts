import { IntegerType } from "kryo/lib/integer.js";

/**
 * ISO 8601 weekday number
 *
 * Monday is 1, Tuesday is 2, ... Sunday is 7.
 */
export type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const $WeekdayNumber: IntegerType = new IntegerType({min: 1, max: 7});
