import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * System OAuth clients have a secondary identifier called their `key`.
 * It is a pre-defined stable identifier known statically.
 * (In contrast, the `id` field is assigned a random UUID by the server).
 */
export type OauthClientKey = string;

export const $OauthClientKey: Ucs2StringType = $Ucs2String;

export type NullableOauthClientKey = null | OauthClientKey;

export const $NullableOauthClientKey: TryUnionType<NullableOauthClientKey> = new TryUnionType({variants: [$Null, $OauthClientKey]});
