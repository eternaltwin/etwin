import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortOauthClient, ShortOauthClient } from "../oauth/short-oauth-client.mjs";
import { $AuthScope, AuthScope } from "./auth-scope.mjs";
import { $AuthType, AuthType } from "./auth-type.mjs";

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
