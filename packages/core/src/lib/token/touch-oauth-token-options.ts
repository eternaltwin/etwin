import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.js";
import { $RfcOauthRefreshTokenKey, RfcOauthRefreshTokenKey } from "../oauth/rfc-oauth-refresh-token-key.js";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";

/**
 * Options when touching a Twinoid OAuth token.
 */
export interface TouchOauthTokenOptions {
  accessToken: RfcOauthAccessTokenKey;
  refreshToken?: RfcOauthRefreshTokenKey;
  expirationTime: Date;
  twinoidUserId: TwinoidUserId;
}

export const $TouchOauthTokenOptions: RecordIoType<TouchOauthTokenOptions> = new RecordType<TouchOauthTokenOptions>({
  properties: {
    accessToken: {type: $RfcOauthAccessTokenKey},
    refreshToken: {type: $RfcOauthRefreshTokenKey, optional: true},
    expirationTime: {type: $Date},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
