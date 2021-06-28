import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $UserFieldsType, UserFieldsType } from "./user-fields-type.js";

export interface CompleteUserFields {
  type: UserFieldsType.Complete;
}

export const $CompleteUserFields: RecordIoType<CompleteUserFields> = new RecordType<CompleteUserFields>({
  properties: {
    type: {type: new LiteralType({type: $UserFieldsType, value: UserFieldsType.Complete})},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const COMPLETE_USER_FIELDS: CompleteUserFields = Object.freeze({type: UserFieldsType.Complete});
