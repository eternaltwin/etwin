import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserRef, UserRef } from "./user-ref.js";

export interface GetShortUserOptions {
  ref: UserRef;
  time?: Date;
}

export const $GetShortUserOptions: RecordIoType<GetShortUserOptions> = new RecordType<GetShortUserOptions>({
  properties: {
    ref: {type: $UserRef},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
