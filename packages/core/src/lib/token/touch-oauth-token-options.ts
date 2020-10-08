import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OauthAccessTokenKey, OauthAccessTokenKey } from "../oauth/oauth-access-token-key.js";
import { $OauthRefreshTokenKey, OauthRefreshTokenKey } from "../oauth/oauth-refresh-token-key.js";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";

/**
 * Options when touching a Twinoid OAuth token.
 */
export interface TouchOauthTokenOptions {
  accessToken: OauthAccessTokenKey;
  refreshToken?: OauthRefreshTokenKey;
  expirationTime: Date;
  twinoidUserId: TwinoidUserId;
}

export const $TouchOauthTokenOptions: RecordIoType<TouchOauthTokenOptions> = new RecordType<TouchOauthTokenOptions>({
  properties: {
    accessToken: {type: $OauthAccessTokenKey},
    refreshToken: {type: $OauthRefreshTokenKey, optional: true},
    expirationTime: {type: $Date},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
