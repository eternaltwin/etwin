import { CaseStyle } from "kryo";
import { $Uint53 } from "kryo/lib/integer.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OauthAccessTokenKey, OauthAccessTokenKey } from "./oauth-access-token-key.js";
import { $OauthTokenType, OauthTokenType } from "./oauth-token-type.js";

export interface OauthAccessToken {
  accessToken: OauthAccessTokenKey;
  expiresIn: number;
  tokenType: OauthTokenType;
}

export const $OauthAccessToken: RecordIoType<OauthAccessToken> = new RecordType<OauthAccessToken>({
  properties: {
    tokenType: {type: new LiteralType({type: $OauthTokenType, value: OauthTokenType.Bearer})},
    accessToken: {type: $OauthAccessTokenKey},
    expiresIn: {type: $Uint53},
  },
  changeCase: CaseStyle.SnakeCase,
});
