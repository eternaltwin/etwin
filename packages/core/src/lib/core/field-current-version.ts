import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDot, UserDot } from "./user-dot.js";

export interface FieldCurrentVersion<T> {
  start: UserDot;
  end: null;
  value: T;
}

export const $FieldCurrentVersion: GenericIoType<<T>(t: T) => FieldCurrentVersion<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldCurrentVersion<T>> => new RecordType({
    properties: {
      start: {type: $UserDot},
      end: {type: $Null},
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
