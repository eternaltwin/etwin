import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserRef, UserRef } from "../user/user-ref.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface UserAuthContext {
  type: AuthType.User;
  scope: AuthScope;
  user: UserRef;
  isAdministrator: boolean;
}

export const $UserAuthContext: RecordIoType<UserAuthContext> = new RecordType<UserAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.User})},
    scope: {type: $AuthScope},
    user: {type: $UserRef},
    isAdministrator: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
