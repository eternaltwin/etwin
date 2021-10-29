import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
