import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

export interface CreateAccessTokenOptions {
  code?: string;
}

export const $CreateAccessTokenOptions: RecordIoType<CreateAccessTokenOptions> = new RecordType<CreateAccessTokenOptions>({
  properties: {
    code: {type: $Ucs2String, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
