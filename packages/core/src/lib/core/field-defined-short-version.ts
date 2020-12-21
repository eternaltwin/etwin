import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

export interface FieldDefinedShortVersion {
  defined: boolean;
}

export const $FieldDefinedShortVersion: RecordIoType<FieldDefinedShortVersion> = new RecordType<FieldDefinedShortVersion>({
  properties: {
    defined: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
