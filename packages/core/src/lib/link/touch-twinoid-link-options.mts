import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface TouchTwinoidLinkOptions {
  etwin: UserIdRef;
  remote: TwinoidUserIdRef;
  linkedBy: UserIdRef;
}

export const $TouchTwinoidLinkOptions: RecordIoType<TouchTwinoidLinkOptions> = new RecordType<TouchTwinoidLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $TwinoidUserIdRef},
    linkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
