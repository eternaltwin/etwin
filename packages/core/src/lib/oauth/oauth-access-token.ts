import { CaseStyle } from "kryo";
import { $Uint53 } from "kryo/lib/integer.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OauthAccessTokenKey, OauthAccessTokenKey } from "./oauth-access-token-key.js";
import { $OauthRefreshTokenKey, OauthRefreshTokenKey } from "./oauth-refresh-token-key.js";
import { $OauthTokenType, OauthTokenType } from "./oauth-token-type.js";

export interface OauthAccessToken {
  accessToken: OauthAccessTokenKey;
  refreshToken?: OauthRefreshTokenKey;

  /**
   * Duration when this token will expire, in seconds.
   */
  expiresIn: number;

  tokenType: OauthTokenType.Bearer;
}

export const $OauthAccessToken: RecordIoType<OauthAccessToken> = new RecordType<OauthAccessToken>({
  properties: {
    accessToken: {type: $OauthAccessTokenKey},
    refreshToken: {type: $OauthRefreshTokenKey, optional: true},
    expiresIn: {type: $Uint53},
    tokenType: {type: new LiteralType({type: $OauthTokenType, value: OauthTokenType.Bearer})},
  },
  changeCase: CaseStyle.SnakeCase,
});
