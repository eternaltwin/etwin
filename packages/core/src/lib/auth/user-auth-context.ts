import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface UserAuthContext {
  type: AuthType.User;
  scope: AuthScope;
  user: ShortUser;
  isAdministrator: boolean;
}

export const $UserAuthContext: RecordIoType<UserAuthContext> = new RecordType<UserAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.User})},
    scope: {type: $AuthScope},
    user: {type: $ShortUser},
    isAdministrator: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
