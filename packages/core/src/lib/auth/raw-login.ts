import { TryUnionType } from "kryo/lib/try-union";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $OauthClientId, OauthClientId } from "../oauth/oauth-client-id.js";
import { $OauthClientKey, OauthClientKey } from "../oauth/oauth-client-key.js";
import { $UserId, UserId } from "../user/user-id.js";
import { $Username, Username } from "../user/username.js";

export type RawLogin = EmailAddress | Username | UserId | OauthClientId | OauthClientKey;

export const $RawLogin: TryUnionType<RawLogin> = new TryUnionType<RawLogin>({
  variants: [$EmailAddress, $Username, $UserId, $OauthClientId, $OauthClientKey],
});
