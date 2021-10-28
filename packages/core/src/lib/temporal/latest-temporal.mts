import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/generic";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ForeignSnapshot, ForeignSnapshot } from "./foreign-snapshot.mjs";

export interface LatestTemporal<T> {
  latest: ForeignSnapshot<T>;
}

export const $LatestTemporal: GenericIoType<<T>(t: T) => LatestTemporal<T>> = new GenericType({
  apply: <T,>(t: IoType<T>): RecordIoType<LatestTemporal<T>> => new RecordType({
    properties: {
      latest: {type: $ForeignSnapshot.apply(t) as RecordIoType<ForeignSnapshot<T>>},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});


export type NullableLatestTemporal<T> = null | LatestTemporal<T>;

export const $NullableLatestTemporal: GenericIoType<<T>(t: T) => NullableLatestTemporal<T>> = new GenericType({
  apply: <T,>(t: IoType<T>): TryUnionType<NullableLatestTemporal<T>> => new TryUnionType({
    variants: [
      $Null,
      $LatestTemporal.apply(t) as RecordIoType<LatestTemporal<T>>,
    ],
  }),
});
