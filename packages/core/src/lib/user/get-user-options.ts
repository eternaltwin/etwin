import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserFields, UserFields } from "./user-fields";
import { $UserRef, UserRef } from "./user-ref.js";

export interface GetUserOptions {
  ref: UserRef;
  fields: UserFields;
  time?: Date;
}

export const $GetUserOptions: RecordIoType<GetUserOptions> = new RecordType<GetUserOptions>({
  properties: {
    ref: {type: $UserRef},
    fields: {type: $UserFields},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
