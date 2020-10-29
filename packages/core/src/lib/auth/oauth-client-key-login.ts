import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $OauthClientKey, OauthClientKey } from "../oauth/oauth-client-key.js";
import { $LoginType, LoginType } from "./login-type.js";

export interface OauthClientKeyLogin {
  type: LoginType.OauthClientKey;

  value: OauthClientKey;
}

export const $OauthClientKeyLogin: RecordIoType<OauthClientKeyLogin> = new RecordType<OauthClientKeyLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.OauthClientKey})},
    value: {type: $OauthClientKey},
  },
  changeCase: CaseStyle.SnakeCase,
});
