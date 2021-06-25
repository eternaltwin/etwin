import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

/**
 * Time period with a finite lower bound
 */
export interface PeriodLower {
  start: Date;
  end: null | Date;
}

export const $PeriodLower: RecordIoType<PeriodLower> = new RecordType<PeriodLower>({
  properties: {
    start: {type: $Date},
    end: {type: new TryUnionType({variants: [$Null, $Date]})},
  },
  changeCase: CaseStyle.SnakeCase,
});
