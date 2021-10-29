import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/generic";
import { RecordIoType, RecordType } from "kryo/record";

import { $FieldShortVersion, FieldShortVersion } from "./field-short-version.mjs";

export interface FieldShortVersions<T> {
  current: FieldShortVersion<T>;
}

export const $FieldShortVersions: GenericIoType<<T>(t: T) => FieldShortVersions<T>> = new GenericType({
  apply: <T,>(t: IoType<T>): RecordIoType<FieldShortVersions<T>> => new RecordType({
    properties: {
      current: {type: $FieldShortVersion.apply(t) as RecordIoType<FieldShortVersion<T>>},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
