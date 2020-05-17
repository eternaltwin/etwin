import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

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
