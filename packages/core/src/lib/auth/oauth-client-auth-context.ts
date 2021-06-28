import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ShortOauthClient, ShortOauthClient } from "../oauth/short-oauth-client.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface OauthClientAuthContext {
  type: AuthType.OauthClient;
  scope: AuthScope;
  client: ShortOauthClient;
}

export const $OauthClientAuthContext: RecordIoType<OauthClientAuthContext> = new RecordType<OauthClientAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.OauthClient})},
    scope: {type: $AuthScope},
    client: {type: $ShortOauthClient},
  },
  changeCase: CaseStyle.SnakeCase,
});
