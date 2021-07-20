import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface TouchDinoparcLinkOptions {
  etwin: UserIdRef;
  remote: DinoparcUserIdRef;
  linkedBy: UserIdRef;
}

export const $TouchDinoparcLinkOptions: RecordIoType<TouchDinoparcLinkOptions> = new RecordType<TouchDinoparcLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $DinoparcUserIdRef},
    linkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
