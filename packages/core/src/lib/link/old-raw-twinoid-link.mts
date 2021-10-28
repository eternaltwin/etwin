import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
