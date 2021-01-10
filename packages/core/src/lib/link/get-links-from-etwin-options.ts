import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface GetLinksFromEtwinOptions {
  etwin: UserIdRef;
  time?: Date;
}

export const $GetLinksFromEtwinOptions: RecordIoType<GetLinksFromEtwinOptions> = new RecordType<GetLinksFromEtwinOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
