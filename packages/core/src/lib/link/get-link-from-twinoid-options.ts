import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.js";

export interface GetLinkFromTwinoidOptions {
  remote: TwinoidUserIdRef;
  time?: Date;
}

export const $GetLinkFromTwinoidOptions: RecordIoType<GetLinkFromTwinoidOptions> = new RecordType<GetLinkFromTwinoidOptions>({
  properties: {
    remote: {type: $TwinoidUserIdRef},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
