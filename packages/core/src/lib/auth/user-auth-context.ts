import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.js";
import { $UserId, UserId } from "../user/user-id.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface UserAuthContext {
  type: AuthType.User;
  scope: AuthScope;
  userId: UserId;
  displayName: UserDisplayName;
  isAdministrator: boolean;
}

export const $UserAuthContext: RecordIoType<UserAuthContext> = new RecordType<UserAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.User})},
    scope: {type: $AuthScope},
    userId: {type: $UserId},
    displayName: {type: $UserDisplayName},
    isAdministrator: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
