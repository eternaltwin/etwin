import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.js";

export interface GetLinkFromDinoparcOptions {
  remote: DinoparcUserIdRef;
  time?: Date;
}

export const $GetLinkFromDinoparcOptions: RecordIoType<GetLinkFromDinoparcOptions> = new RecordType<GetLinkFromDinoparcOptions>({
  properties: {
    remote: {type: $DinoparcUserIdRef},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
