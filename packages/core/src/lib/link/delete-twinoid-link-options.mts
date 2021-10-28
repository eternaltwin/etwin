import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface DeleteTwinoidLinkOptions {
  etwin: UserIdRef;
  remote: TwinoidUserIdRef;
  unlinkedBy: UserIdRef;
}

export const $DeleteTwinoidLinkOptions: RecordIoType<DeleteTwinoidLinkOptions> = new RecordType<DeleteTwinoidLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $TwinoidUserIdRef},
    unlinkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
