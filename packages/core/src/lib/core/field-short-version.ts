import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/generic";
import { RecordIoType, RecordType } from "kryo/record";

export interface FieldShortVersion<T> {
  value: T;
}

export const $FieldShortVersion: GenericIoType<<T>(t: T) => FieldShortVersion<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<FieldShortVersion<T>> => new RecordType({
    properties: {
      value: {type: t},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});
