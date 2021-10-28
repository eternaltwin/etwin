import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

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
