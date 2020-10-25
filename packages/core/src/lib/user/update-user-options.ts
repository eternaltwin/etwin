import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";

export interface UpdateUserOptions {
  displayName?: UserDisplayName;
}

export const $GetUserByIdOptions: RecordIoType<UpdateUserOptions> = new RecordType<UpdateUserOptions>({
  properties: {
    displayName: {type: $UserDisplayName, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
