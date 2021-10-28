import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
