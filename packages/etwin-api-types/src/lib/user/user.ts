import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

import { $UserDisplayName, UserDisplayName } from "./user-display-name.js";

/**
 * Represents an Eternal-Twin user (without private data).
 */
export interface User {
  id: UuidHex;

  displayName: UserDisplayName;

  isAdministrator: boolean;
}

export const $User: RecordIoType<User> = new RecordType<User>({
  properties: {
    id: {type: $UuidHex},
    displayName: {type: $UserDisplayName},
    isAdministrator: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
