import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * Unique stable OAuth client identifier with the `@clients` suffix.
 */
export type OauthClientKey = string;

export const $OauthClientKey: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 10,
  maxLength: 40,
  pattern: /^[a-z_][a-z0-9_]{1,31}@clients$/,
});

export type NullableOauthClientKey = null | OauthClientKey;

export const $NullableOauthClientKey: TryUnionType<NullableOauthClientKey> = new TryUnionType({variants: [$Null, $OauthClientKey]});
