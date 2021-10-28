import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.mjs";

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
