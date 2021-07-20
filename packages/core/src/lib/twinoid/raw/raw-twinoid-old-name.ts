import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "../twinoid-user-display-name.js";
import { $TwinoidTime, TwinoidTime } from "./twinoid-time.js";

export interface RawTwinoidOldName {
  name: TwinoidUserDisplayName;
  until: TwinoidTime;
}

export const $RawTwinoidOldName: RecordIoType<RawTwinoidOldName> = new RecordType<RawTwinoidOldName>({
  properties: {
    name: {type: $TwinoidUserDisplayName},
    until: {type: $TwinoidTime},
  },
  changeCase: CaseStyle.CamelCase,
});
