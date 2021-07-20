import { TryUnionType } from "kryo/try-union";

import { $OauthClientBareKey, OauthClientBareKey } from "./oauth-client-bare-key.js";
import { $OauthClientKey, OauthClientKey } from "./oauth-client-key.js";

/**
 * Represents an OAuth client key (stable id) where the suffix `@clients` is optional.
 *
 * Internally, the key is always typed (with the suffix). The bare (untyped) version is only used when reading some
 * URIs or for internal storage.
 */
export type OauthClientInputKey = OauthClientBareKey | OauthClientKey;

export const $OauthClientInputKey: TryUnionType<OauthClientInputKey> = new TryUnionType({variants: [$OauthClientBareKey, $OauthClientKey]});
