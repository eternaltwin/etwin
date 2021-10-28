import { TryUnionType } from "kryo/try-union";

import { $OauthClientBareKey, OauthClientBareKey } from "./oauth-client-bare-key.mjs";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.mjs";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.mjs";

/**
 * Any identifier-like string for Eternal-Twin's Oauth clients.
 */
export type OauthClientInputRef = OauthClientBareKey | OauthClientId | OauthClientKey;

export const $OauthClientInputRef: TryUnionType<OauthClientInputRef> = new TryUnionType({variants: [$OauthClientBareKey, $OauthClientId, $OauthClientKey]});
