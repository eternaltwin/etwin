import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { RecordIoType, RecordType } from "kryo/record";

import { $FieldDefinedCurrentVersion, FieldDefinedCurrentVersion } from "./field-defined-current-version.mjs";
import { $FieldDefinedOldVersion, FieldDefinedOldVersion } from "./field-defined-old-version.mjs";

export interface FieldDefinedVersions {
  current: FieldDefinedCurrentVersion;
  old: FieldDefinedOldVersion[];
}

export const $FieldDefinedVersions: RecordIoType<FieldDefinedVersions> = new RecordType<FieldDefinedVersions>({
  properties: {
    current: {type: $FieldDefinedCurrentVersion},
    old: {type: new ArrayType({itemType: $FieldDefinedOldVersion, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
