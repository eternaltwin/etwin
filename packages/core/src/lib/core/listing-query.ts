import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

export interface ListingQuery {
  offset?: number;
  limit?: number;
}

export const $ListingQuery: RecordIoType<ListingQuery> = new RecordType<ListingQuery>({
  properties: {
    offset: {type: $Uint16, optional: true},
    limit: {type: $Uint16, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
