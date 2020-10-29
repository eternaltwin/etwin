import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $EtwinOauthClientId, EtwinOauthClientId } from "../oauth/etwin/etwin-oauth-client-id.js";
import { $LoginType, LoginType } from "./login-type.js";

export interface OauthClientIdLogin {
  type: LoginType.OauthClientId;

  value: EtwinOauthClientId;
}

export const $OauthClientIdLogin: RecordIoType<OauthClientIdLogin> = new RecordType<OauthClientIdLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.OauthClientId})},
    value: {type: $EtwinOauthClientId},
  },
  changeCase: CaseStyle.SnakeCase,
});
