import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserFieldsType, UserFieldsType } from "./user-fields-type.mjs";

export interface DefaultUserFields {
  type: UserFieldsType.Default;
}

export const $DefaultUserFields: RecordIoType<DefaultUserFields> = new RecordType<DefaultUserFields>({
  properties: {
    type: {type: new LiteralType({type: $UserFieldsType, value: UserFieldsType.Default})},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const DEFAULT_USER_FIELDS: DefaultUserFields = Object.freeze({type: UserFieldsType.Default});
