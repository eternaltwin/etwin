import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
