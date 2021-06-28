import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { RecordIoType, RecordType } from "kryo/lib/record";

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
