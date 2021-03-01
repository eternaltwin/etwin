import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface DeleteHammerfestLinkOptions {
  etwin: UserIdRef;
  remote: HammerfestUserIdRef;
  unlinkedBy: UserIdRef;
}

export const $DeleteHammerfestLinkOptions: RecordIoType<DeleteHammerfestLinkOptions> = new RecordType<DeleteHammerfestLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $HammerfestUserIdRef},
    unlinkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
