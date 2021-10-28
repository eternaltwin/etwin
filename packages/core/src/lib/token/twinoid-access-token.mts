import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.mjs";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.mjs";

export interface TwinoidAccessToken {
  key: RfcOauthAccessTokenKey;
  ctime: Date;
  atime: Date;
  expirationTime: Date;
  twinoidUserId: TwinoidUserId;
}

export const $TwinoidAccessToken: RecordIoType<TwinoidAccessToken> = new RecordType<TwinoidAccessToken>({
  properties: {
    key: {type: $RfcOauthAccessTokenKey},
    ctime: {type: $Date},
    atime: {type: $Date},
    expirationTime: {type: $Date},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidAccessToken = null | TwinoidAccessToken;

export const $NullableTwinoidAccessToken: TryUnionType<NullableTwinoidAccessToken> = new TryUnionType({variants: [$Null, $TwinoidAccessToken]});
