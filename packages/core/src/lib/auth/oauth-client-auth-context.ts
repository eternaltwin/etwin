import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OauthClientRef, OauthClientRef } from "../oauth/oauth-client-ref.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface OauthClientAuthContext {
  type: AuthType.OauthClient;
  scope: AuthScope;
  client: OauthClientRef;
}

export const $OauthClientAuthContext: RecordIoType<OauthClientAuthContext> = new RecordType<OauthClientAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.OauthClient})},
    scope: {type: $AuthScope},
    client: {type: $OauthClientRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
