import { TryUnionType } from "kryo/lib/try-union.js";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $EtwinOauthClientId, EtwinOauthClientId } from "../oauth/etwin/etwin-oauth-client-id.js";
import { $OauthClientId, OauthClientId } from "../oauth/oauth-client-id.js";
import { $UserId, UserId } from "../user/user-id.js";
import { $Username, Username } from "../user/username.js";

export type RawLogin = EmailAddress | Username | UserId | EtwinOauthClientId | OauthClientId;

export const $RawLogin: TryUnionType<RawLogin> = new TryUnionType<RawLogin>({
  variants: [$EmailAddress, $Username, $UserId, $EtwinOauthClientId, $OauthClientId],
});
