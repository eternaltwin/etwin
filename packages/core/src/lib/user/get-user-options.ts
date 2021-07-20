import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserFields, UserFields } from "./user-fields.js";
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
