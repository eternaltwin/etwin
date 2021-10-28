import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $HammerfestItemCounts, HammerfestItemCounts } from "./hammerfest-item-counts.mjs";

export interface StoredHammerfestItems {
  firstArchivedAt: Date;
  lastArchivedAt: Date;
  items: HammerfestItemCounts;
}

export const $StoredHammerfestItems: RecordIoType<StoredHammerfestItems> = new RecordType<StoredHammerfestItems>({
  properties: {
    firstArchivedAt: {type: $Date},
    lastArchivedAt: {type: $Date},
    items: {type: $HammerfestItemCounts},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableStoredHammerfestItems = null | StoredHammerfestItems;

export const $NullableStoredHammerfestItems: TryUnionType<NullableStoredHammerfestItems> = new TryUnionType({variants: [$Null, $StoredHammerfestItems]});
