import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

export interface TimeQuery {
  time?: Date;
}

export const $TimeQuery: RecordIoType<TimeQuery> = new RecordType<TimeQuery>({
  properties: {
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
