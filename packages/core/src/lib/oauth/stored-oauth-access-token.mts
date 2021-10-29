import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";
import { $OauthClientIdRef, OauthClientIdRef } from "./oauth-client-id-ref.mjs";
import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.mjs";

export interface StoredOauthAccessToken {
  key: RfcOauthAccessTokenKey;

  ctime: Date;

  atime: Date;

  expirationTime: Date;

  user: UserIdRef;

  client: OauthClientIdRef;
}

export const $StoredOauthAccessToken: RecordIoType<StoredOauthAccessToken> = new RecordType<StoredOauthAccessToken>({
  properties: {
    key: {type: $RfcOauthAccessTokenKey},
    ctime: {type: $Date},
    atime: {type: $Date},
    expirationTime: {type: $Date},
    user: {type: $UserIdRef},
    client: {type: $OauthClientIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
