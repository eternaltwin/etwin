import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

export interface ErrorLike {
  name?: string;
  message: string;
}

export const $ErrorLike: RecordIoType<ErrorLike> = new RecordType<ErrorLike>({
  properties: {
    name: {type: $Ucs2String, optional: true},
    message: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});
