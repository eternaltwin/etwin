import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.js";

export interface GetLinkFromHammerfestOptions {
  remote: HammerfestUserIdRef;
  time?: Date;
}

export const $GetLinkFromHammerfestOptions: RecordIoType<GetLinkFromHammerfestOptions> = new RecordType<GetLinkFromHammerfestOptions>({
  properties: {
    remote: {type: $HammerfestUserIdRef},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
