import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * Unique handle used for authentication. Not all users have a username.
 */
export type Username = string;

/**
 * Can only contain lowercase ascii letters and digits. Must start with a letter.
 */
export const $Username: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 32,
  pattern: /^[a-z_][a-z0-9_]{1,31}$/,
});

export type NullableUsername = null | Username;

export const $NullableUsername: TryUnionType<NullableUsername> = new TryUnionType({variants: [$Null, $Username]});
