import { TryUnionType } from "kryo/try-union";

import { $OauthClientIdRef, OauthClientIdRef } from "./oauth-client-id-ref.mjs";
import { $OauthClientKeyRef, OauthClientKeyRef } from "./oauth-client-key-ref.mjs";

export type OauthClientRef = OauthClientIdRef | OauthClientKeyRef;

export const $OauthClientRef: TryUnionType<OauthClientRef> = new TryUnionType({variants: [$OauthClientIdRef, $OauthClientKeyRef]});
