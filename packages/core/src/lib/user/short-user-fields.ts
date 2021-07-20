import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserFieldsType, UserFieldsType } from "./user-fields-type.js";

export interface ShortUserFields {
  type: UserFieldsType.Short;
}

export const $ShortUserFields: RecordIoType<ShortUserFields> = new RecordType<ShortUserFields>({
  properties: {
    type: {type: new LiteralType({type: $UserFieldsType, value: UserFieldsType.Short})},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const SHORT_USER_FIELDS: ShortUserFields = Object.freeze({type: UserFieldsType.Short});
