import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $UserId, UserId } from "../user/user-id.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $RfcOauthAccessTokenKey, RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.js";

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
