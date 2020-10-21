import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDisplayNameVersion, UserDisplayNameVersion } from "./user-display-name-version.js";

export interface UserDisplayNameVersions {
  current: UserDisplayNameVersion;
  latest?: UserDisplayNameVersion;
}

export const $UserDisplayNameVersions: RecordIoType<UserDisplayNameVersions> = new RecordType<UserDisplayNameVersions>({
  properties: {
    current: {type: $UserDisplayNameVersion},
    latest: {type: $UserDisplayNameVersion, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
