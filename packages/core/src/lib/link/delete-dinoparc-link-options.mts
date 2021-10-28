import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface DeleteDinoparcLinkOptions {
  etwin: UserIdRef;
  remote: DinoparcUserIdRef;
  unlinkedBy: UserIdRef;
}

export const $DeleteDinoparcLinkOptions: RecordIoType<DeleteDinoparcLinkOptions> = new RecordType<DeleteDinoparcLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $DinoparcUserIdRef},
    unlinkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
