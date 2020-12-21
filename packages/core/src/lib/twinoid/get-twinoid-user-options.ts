import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

export interface GetTwinoidUserOptions {
  id: TwinoidUserId;
  time?: Date;
}

export const $GetTwinoidUserOptions: RecordIoType<GetTwinoidUserOptions> = new RecordType<GetTwinoidUserOptions>({
  properties: {
    id: {type: $TwinoidUserId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
