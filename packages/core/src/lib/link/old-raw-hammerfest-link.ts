import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.js";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface OldRawHammerfestLink {
  link: RawUserDot;
  unlink: RawUserDot;
  etwin: UserIdRef;
  remote: HammerfestUserIdRef;
}

export const $OldRawHammerfestLink: RecordIoType<OldRawHammerfestLink> = new RecordType<OldRawHammerfestLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $RawUserDot},
    etwin: {type: $UserIdRef},
    remote: {type: $HammerfestUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
