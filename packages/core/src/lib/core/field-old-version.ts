import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDot, UserDot } from "./user-dot.js";

export interface FieldOldVersion<T> {
  start: UserDot;
  end: UserDot;
  value: T;
}

export const $FieldOldVersion: GenericIoType<<T>(t: T) => FieldOldVersion<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldOldVersion<T>> => new RecordType({
    properties: {
      start: {type: $UserDot},
      end: {type: $UserDot},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
