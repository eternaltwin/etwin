import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $FieldDefinedCurrentVersion, FieldDefinedCurrentVersion } from "./field-defined-current-version.js";
import { $FieldDefinedOldVersion, FieldDefinedOldVersion } from "./field-defined-old-version.js";

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
