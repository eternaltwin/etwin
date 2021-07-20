import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $OauthClientId, OauthClientId } from "../oauth/oauth-client-id.js";
import { $UserId, UserId } from "../user/user-id.js";
import { $LoginType, LoginType } from "./login-type.js";

export interface UuidLogin {
  type: LoginType.Uuid;

  value: UserId | OauthClientId;
}

export const $UuidLogin: RecordIoType<UuidLogin> = new RecordType<UuidLogin>({
  properties: {
    type: {type: new LiteralType({type: $LoginType, value: LoginType.Uuid})},
    value: {type: new TryUnionType({variants: [$UserId, $OauthClientId]})},
  },
  changeCase: CaseStyle.SnakeCase,
});
