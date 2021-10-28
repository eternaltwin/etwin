import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface OldRawDinoparcLink {
  link: RawUserDot;
  unlink: RawUserDot;
  etwin: UserIdRef;
  remote: DinoparcUserIdRef;
}

export const $OldRawDinoparcLink: RecordIoType<OldRawDinoparcLink> = new RecordType<OldRawDinoparcLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $RawUserDot},
    etwin: {type: $UserIdRef},
    remote: {type: $DinoparcUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
