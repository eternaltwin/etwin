import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDot, UserDot } from "./user-dot.js";

export interface FieldDefinedCurrentVersion {
  start: UserDot;
  end: null;
  defined: boolean;
}

export const $FieldDefinedCurrentVersion: RecordIoType<FieldDefinedCurrentVersion> = new RecordType<FieldDefinedCurrentVersion>({
  properties: {
    start: {type: $UserDot},
    end: {type: $Null},
    defined: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
