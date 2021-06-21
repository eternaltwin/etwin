import { CaseStyle, IoType } from "kryo";
import { GenericIoType, GenericType } from "kryo/lib/generic.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $Snapshot, Snapshot } from "./snapshot.js";

export interface LatestTemporal<T> {
  latest: Snapshot<T>;
}

export const $LatestTemporal: GenericIoType<<T>(t: T) => LatestTemporal<T>> = new GenericType({
  apply: <T>(t: IoType<T>): RecordIoType<LatestTemporal<T>> => new RecordType({
    properties: {
      latest: {type: $Snapshot.apply(t) as RecordIoType<Snapshot<T>>},
    },
    changeCase: CaseStyle.SnakeCase,
  }),
});


export type NullableLatestTemporal<T> = null | LatestTemporal<T>;

export const $NullableLatestTemporal: GenericIoType<<T>(t: T) => NullableLatestTemporal<T>> = new GenericType({
  apply: <T>(t: IoType<T>): TryUnionType<NullableLatestTemporal<T>> => new TryUnionType({
    variants: [
      $Null,
      $LatestTemporal.apply(t) as RecordIoType<LatestTemporal<T>>,
    ],
  }),
});
