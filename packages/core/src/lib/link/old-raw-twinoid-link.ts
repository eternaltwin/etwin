import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.js";
import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface OldRawTwinoidLink {
  link: RawUserDot;
  unlink: RawUserDot;
  etwin: UserIdRef;
  remote: TwinoidUserIdRef;
}

export const $OldRawTwinoidLink: RecordIoType<OldRawTwinoidLink> = new RecordType<OldRawTwinoidLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $RawUserDot},
    etwin: {type: $UserIdRef},
    remote: {type: $TwinoidUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
