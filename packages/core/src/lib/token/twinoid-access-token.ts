import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $OauthAccessTokenKey, OauthAccessTokenKey } from "../oauth/oauth-access-token-key.js";
import { $TwinoidUserId, TwinoidUserId } from "../twinoid/twinoid-user-id.js";

export interface TwinoidAccessToken {
  key: OauthAccessTokenKey;
  ctime: Date;
  atime: Date;
  expirationTime: Date;
  twinoidUserId: TwinoidUserId;
}

export const $TwinoidAccessToken: RecordIoType<TwinoidAccessToken> = new RecordType<TwinoidAccessToken>({
  properties: {
    key: {type: $OauthAccessTokenKey},
    ctime: {type: $Date},
    atime: {type: $Date},
    expirationTime: {type: $Date},
    twinoidUserId: {type: $TwinoidUserId},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableTwinoidAccessToken = null | TwinoidAccessToken;

export const $NullableTwinoidAccessToken: TryUnionType<NullableTwinoidAccessToken> = new TryUnionType({variants: [$Null, $TwinoidAccessToken]});
