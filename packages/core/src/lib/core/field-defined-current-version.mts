import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserDot, UserDot } from "./user-dot.mjs";

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
