import { TryUnionType } from "kryo/lib/try-union.js";

import { $OauthClientBareKey, OauthClientBareKey } from "./oauth-client-bare-key.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.js";

/**
 * Any identifier-like string for Eternal-Twin's Oauth clients.
 */
export type OauthClientInputRef = OauthClientBareKey | OauthClientId | OauthClientKey;

export const $OauthClientInputRef: TryUnionType<OauthClientInputRef> = new TryUnionType({variants: [$OauthClientBareKey, $OauthClientId, $OauthClientKey]});
