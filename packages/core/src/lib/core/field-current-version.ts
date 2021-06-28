import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $UserDot, UserDot } from "./user-dot.js";

export interface FieldCurrentVersion<T> {
  start?: UserDot;
  end?: null;
  value: T;
}

export const $FieldCurrentVersion: GenericIoType<<T>(t: T) => FieldCurrentVersion<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldCurrentVersion<T>> => new RecordType({
    properties: {
      start: {type: $UserDot, optional: true},
      end: {type: $Null, optional: true},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
