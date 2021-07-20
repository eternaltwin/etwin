import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { RecordIoType, RecordType } from "kryo/record";

export interface FieldDefinedShortVersion {
  defined: boolean;
}

export const $FieldDefinedShortVersion: RecordIoType<FieldDefinedShortVersion> = new RecordType<FieldDefinedShortVersion>({
  properties: {
    defined: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
