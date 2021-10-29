import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $AuthScope, AuthScope } from "./auth-scope.mjs";
import { $AuthType, AuthType } from "./auth-type.mjs";

export interface SystemAuthContext {
  type: AuthType.System;
  scope: AuthScope;
}

export const $SystemAuthContext: RecordIoType<SystemAuthContext> = new RecordType<SystemAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.System})},
    scope: {type: $AuthScope},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const SYSTEM_AUTH: SystemAuthContext = Object.freeze({type: AuthType.System, scope: AuthScope.Default});
