import { TryUnionType } from "kryo/lib/try-union.js";

import { $OauthClientIdRef, OauthClientIdRef } from "./oauth-client-id-ref.js";
import { $OauthClientKeyRef, OauthClientKeyRef } from "./oauth-client-key-ref.js";

export type OauthClientRef = OauthClientIdRef | OauthClientKeyRef;

export const $OauthClientRef: TryUnionType<OauthClientRef> = new TryUnionType({variants: [$OauthClientIdRef, $OauthClientKeyRef]});
