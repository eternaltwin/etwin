import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface TouchHammerfestLinkOptions {
  etwin: UserIdRef;
  remote: HammerfestUserIdRef;
  linkedBy: UserIdRef;
}

export const $TouchHammerfestLinkOptions: RecordIoType<TouchHammerfestLinkOptions> = new RecordType<TouchHammerfestLinkOptions>({
  properties: {
    etwin: {type: $UserIdRef},
    remote: {type: $HammerfestUserIdRef},
    linkedBy: {type: $UserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
