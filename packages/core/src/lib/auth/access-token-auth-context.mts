import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortOauthClient, ShortOauthClient } from "../oauth/short-oauth-client.mjs";
import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $AuthScope, AuthScope } from "./auth-scope.mjs";
import { $AuthType, AuthType } from "./auth-type.mjs";

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
