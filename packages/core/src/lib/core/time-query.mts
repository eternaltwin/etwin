import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

export interface TimeQuery {
  time?: Date;
}

export const $TimeQuery: RecordIoType<TimeQuery> = new RecordType<TimeQuery>({
  properties: {
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
