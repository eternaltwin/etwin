import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ShortOauthClient, ShortOauthClient } from "../oauth/short-oauth-client.js";
import { $ShortUser, ShortUser } from "../user/short-user.js";
import { $AuthScope, AuthScope } from "./auth-scope.js";
import { $AuthType, AuthType } from "./auth-type.js";

export interface AccessTokenAuthContext {
  type: AuthType.AccessToken;
  scope: AuthScope;
  client: ShortOauthClient;
  user: ShortUser;
}

export const $AccessTokenAuthContext: RecordIoType<AccessTokenAuthContext> = new RecordType<AccessTokenAuthContext>({
  properties: {
    type: {type: new LiteralType({type: $AuthType, value: AuthType.AccessToken})},
    scope: {type: $AuthScope},
    client: {type: $ShortOauthClient},
    user: {type: $ShortUser},
  },
  changeCase: CaseStyle.SnakeCase,
});
