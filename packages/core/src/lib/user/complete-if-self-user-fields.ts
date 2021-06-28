import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $UserFieldsType, UserFieldsType } from "./user-fields-type.js";
import { $UserId, UserId } from "./user-id.js";

export interface CompleteIfSelfUserFields {
  type: UserFieldsType.CompleteIfSelf;
  selfUserId: UserId;
}

export const $CompleteIfSelfUserFields: RecordIoType<CompleteIfSelfUserFields> = new RecordType<CompleteIfSelfUserFields>({
  properties: {
    type: {type: new LiteralType({type: $UserFieldsType, value: UserFieldsType.CompleteIfSelf})},
    selfUserId: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
