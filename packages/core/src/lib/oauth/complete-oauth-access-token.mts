import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortUser, ShortUser } from "../user/short-user.mjs";
import { $EtwinOauthAccessTokenKey, EtwinOauthAccessTokenKey } from "./etwin-oauth-access-token-key.mjs";
import { $ShortOauthClient, ShortOauthClient } from "./short-oauth-client.mjs";

export interface CompleteOauthAccessToken {
  key: EtwinOauthAccessTokenKey;

  ctime: Date;

  atime: Date;

  expirationTime: Date;

  user: ShortUser;

  client: ShortOauthClient;
}

export const $CompleteOauthAccessToken: RecordIoType<CompleteOauthAccessToken> = new RecordType<CompleteOauthAccessToken>({
  properties: {
    key: {type: $EtwinOauthAccessTokenKey},
    ctime: {type: $Date},
    atime: {type: $Date},
    expirationTime: {type: $Date},
    user: {type: $ShortUser},
    client: {type: $ShortOauthClient},
  },
  changeCase: CaseStyle.SnakeCase,
});
