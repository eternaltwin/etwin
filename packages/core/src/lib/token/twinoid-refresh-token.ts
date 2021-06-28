import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

import { $RfcOauthRefreshTokenKey, RfcOauthRefreshTokenKey } from "../oauth/rfc-oauth-refresh-token-key.js";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";

export interface TwinoidRefreshToken {
  key: RfcOauthRefreshTokenKey;
  ctime: Date;
  atime: Date;
  twinoidUserId: TwinoidUserId;
}

export const $TwinoidRefreshToken: RecordIoType<TwinoidRefreshToken> = new RecordType<TwinoidRefreshToken>({
  properties: {
    key: {type: $RfcOauthRefreshTokenKey},
    ctime: {type: $Date},
    atime: {type: $Date},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidRefreshToken = null | TwinoidRefreshToken;

export const $NullableTwinoidRefreshToken: TryUnionType<NullableTwinoidRefreshToken> = new TryUnionType({variants: [$Null, $TwinoidRefreshToken]});
