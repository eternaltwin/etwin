import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/generic";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserDot, UserDot } from "./user-dot.mjs";

export interface FieldCurrentVersion<T> {
  start?: UserDot;
  end?: null;
  value: T;
}

export const $FieldCurrentVersion: GenericIoType<<T>(t: T) => FieldCurrentVersion<T>> = new GenericType({
  apply: <T,>(t: IoType<T>): RecordIoType<FieldCurrentVersion<T>> => new RecordType({
    properties: {
      start: {type: $UserDot, optional: true},
      end: {type: $Null, optional: true},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
