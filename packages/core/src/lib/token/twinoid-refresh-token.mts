import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $RfcOauthRefreshTokenKey, RfcOauthRefreshTokenKey } from "../oauth/rfc-oauth-refresh-token-key.mjs";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.mjs";

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
