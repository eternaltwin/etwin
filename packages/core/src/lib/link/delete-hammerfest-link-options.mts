import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
