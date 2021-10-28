import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

/**
 * A listing exposing only the item count
 */
export interface ListingCount {
  count: number;
}

export const $ListingCount: RecordIoType<ListingCount> = new RecordType<ListingCount>({
  properties: {
    count: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});
