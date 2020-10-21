import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";

export interface UserDisplayNameVersion {
  value: UserDisplayName;
}

export const $UserDisplayNameVersion: RecordIoType<UserDisplayNameVersion> = new RecordType<UserDisplayNameVersion>({
  properties: {
    value: {type: $UserDisplayName},
  },
  changeCase: CaseStyle.SnakeCase,
});
