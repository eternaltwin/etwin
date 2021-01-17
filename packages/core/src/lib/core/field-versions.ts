import { CaseStyle, IoType } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { GenericIoType, GenericType } from "kryo/lib/generic.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $FieldCurrentVersion, FieldCurrentVersion } from "./field-current-version.js";
import { $FieldOldVersion, FieldOldVersion } from "./field-old-version.js";

export interface FieldVersions<T> {
  current: FieldCurrentVersion<T>;
  old?: FieldOldVersion<T>[];
}

export const $FieldVersions: GenericIoType<<T>(t: T) => FieldVersions<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldVersions<T>> => new RecordType({
    properties: {
      current: {type: $FieldCurrentVersion.apply(t) as RecordIoType<FieldCurrentVersion<T>>},
      old: {
        type: new ArrayType({
          itemType: $FieldOldVersion.apply(t) as RecordIoType<FieldOldVersion<T>>,
          maxLength: 100,
        }),
        optional: true,
      },
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
