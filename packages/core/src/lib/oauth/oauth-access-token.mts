import { CaseStyle } from "kryo";
import { $Uint53 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $OauthTokenType, OauthTokenType } from "./oauth-token-type.mjs";
import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.mjs";
import { $RfcOauthRefreshTokenKey, RfcOauthRefreshTokenKey } from "./rfc-oauth-refresh-token-key.mjs";

export interface OauthAccessToken {
  accessToken: RfcOauthAccessTokenKey;
  refreshToken?: RfcOauthRefreshTokenKey;

  /**
   * Duration when this token will expire, in seconds.
   */
  expiresIn: number;

  tokenType: OauthTokenType.Bearer;
}

export const $OauthAccessToken: RecordIoType<OauthAccessToken> = new RecordType<OauthAccessToken>({
  properties: {
    accessToken: {type: $RfcOauthAccessTokenKey},
    refreshToken: {type: $RfcOauthRefreshTokenKey, optional: true},
    expiresIn: {type: $Uint53},
    tokenType: {type: new LiteralType({type: $OauthTokenType, value: OauthTokenType.Bearer})},
  },
  changeCase: CaseStyle.SnakeCase,
});
