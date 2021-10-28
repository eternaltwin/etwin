import { TryUnionType } from "kryo/try-union";

import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";
import { $OauthClientId, OauthClientId } from "../oauth/oauth-client-id.mjs";
import { $OauthClientKey, OauthClientKey } from "../oauth/oauth-client-key.mjs";
import { $UserId, UserId } from "../user/user-id.mjs";
import { $Username, Username } from "../user/username.mjs";

export type RawLogin = EmailAddress | Username | UserId | OauthClientId | OauthClientKey;

export const $RawLogin: TryUnionType<RawLogin> = new TryUnionType<RawLogin>({
  variants: [$EmailAddress, $Username, $UserId, $OauthClientId, $OauthClientKey],
});
