import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

/**
 * Retrieval metadata for foreign data
 */
export interface ForeignRetrieved {
  latest: Date;
}

export const $ForeignRetrieved: RecordIoType<ForeignRetrieved> = new RecordType<ForeignRetrieved>({
  properties: {
    latest: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});
