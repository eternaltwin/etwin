import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $PeriodLower, PeriodLower } from "../core/period-lower.js";

export interface Snapshot<T> {
  period: PeriodLower;
  value: T;
}

export const $Snapshot: GenericIoType<<T>(t: T) => Snapshot<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<Snapshot<T>> => new RecordType({
    properties: {
      period: {type: $PeriodLower},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
