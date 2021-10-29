import { CaseStyle, IoType } from "kryo";
import { IntegerType } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $MonthNumber, MonthNumber } from "../core/month-number.mjs";
import { $WeekdayNumber, WeekdayNumber } from "../core/weekday-number.mjs";

/**
 * A forum date: a date without a year.
 */
export interface HammerfestForumDate {
  month: MonthNumber;
  day: number;
  weekday: WeekdayNumber;
  hour: number;
  minute: number;
}

export const $HammerfestForumDate: RecordIoType<HammerfestForumDate> = new RecordType<HammerfestForumDate>({
  properties: {
    month: {type: $MonthNumber as IoType<MonthNumber>},
    day: {type: new IntegerType({min: 1, max: 31})},
    weekday: {type: $WeekdayNumber as IoType<WeekdayNumber>},
    hour: {type: new IntegerType({min: 0, max: 23})},
    minute: {type: new IntegerType({min: 0, max: 59})},
  },
  changeCase: CaseStyle.SnakeCase,
});
