import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $FieldShortVersion, FieldShortVersion } from "./field-short-version.js";

export interface FieldShortVersions<T> {
  current: FieldShortVersion<T>;
}

export const $FieldShortVersions: GenericIoType<<T>(t: T) => FieldShortVersions<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldShortVersions<T>> => new RecordType({
    properties: {
      current: {type: $FieldShortVersion.apply(t) as RecordIoType<FieldShortVersion<T>>},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
