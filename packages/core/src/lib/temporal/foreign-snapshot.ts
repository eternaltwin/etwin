import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $PeriodLower, PeriodLower } from "../core/period-lower.js";
import { $ForeignRetrieved, ForeignRetrieved } from "./foreign-retrieved.js";

export interface ForeignSnapshot<T> {
  period: PeriodLower;
  retrieved: ForeignRetrieved;
  value: T;
}

export const $ForeignSnapshot: GenericIoType<<T>(t: T) => ForeignSnapshot<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<ForeignSnapshot<T>> => new RecordType({
    properties: {
      period: {type: $PeriodLower},
      retrieved: {type: $ForeignRetrieved},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
