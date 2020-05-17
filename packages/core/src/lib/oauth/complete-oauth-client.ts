import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $Url, Url } from "../core/url.js";
import { $OauthClientDisplayName, OauthClientDisplayName } from "./oauth-client-display-name.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.js";

export interface CompleteOauthClient {
  type: ObjectType.OauthClient;
  id: OauthClientId;
  displayName: OauthClientDisplayName;
  appUrl: Url;
  callbackUrl: Url;
  secret: OauthClientSecret;
}

export const $CompleteOauthClient: RecordIoType<CompleteOauthClient> = new RecordType<CompleteOauthClient>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.OauthClient})},
    id: {type: $OauthClientId},
    displayName: {type: $OauthClientDisplayName},
    appUrl: {type: $Url},
    callbackUrl: {type: $Url},
    secret: {type: $OauthClientSecret},
  },
  changeCase: CaseStyle.SnakeCase,
});
