import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

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
