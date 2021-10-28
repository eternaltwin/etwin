import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserId, UserId } from "../user/user-id.mjs";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.mjs";
import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.mjs";

export interface CreateStoredOauthAccessTokenOptions {
  key: RfcOauthAccessTokenKey;

  ctime: Date;

  expirationTime: Date;

  userId: UserId;

  clientId: OauthClientId;
}

export const $StoredOauthAccessToken: RecordIoType<CreateStoredOauthAccessTokenOptions> = new RecordType<CreateStoredOauthAccessTokenOptions>({
  properties: {
    key: {type: $RfcOauthAccessTokenKey},
    ctime: {type: $Date},
    expirationTime: {type: $Date},
    userId: {type: $UserId},
    clientId: {type: $OauthClientId},
  },
  changeCase: CaseStyle.SnakeCase,
});
