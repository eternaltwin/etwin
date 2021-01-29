import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ShortRawTwinoidUser, ShortRawTwinoidUser } from "./raw-twinoid-user.js";

export interface RawTwinoidContact {
  friend: boolean;
  user: ShortRawTwinoidUser;
}

export const $RawTwinoidContact: RecordIoType<RawTwinoidContact> = new RecordType<RawTwinoidContact>(() => ({
  properties: {
    friend: {type: $Boolean},
    user: {type: $ShortRawTwinoidUser},
  },
  changeCase: CaseStyle.CamelCase,
}));
