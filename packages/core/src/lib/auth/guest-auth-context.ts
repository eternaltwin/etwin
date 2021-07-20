import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface GuestAuthContext {
  type: AuthType.Guest;
  scope: AuthScope;
}

export const $GuestAuthContext: RecordIoType<GuestAuthContext> = new RecordType<GuestAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.Guest})},
    scope: {type: $AuthScope},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const GUEST_AUTH: GuestAuthContext = Object.freeze({type: AuthType.Guest, scope: AuthScope.Default});
