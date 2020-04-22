import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * Unique handle used for authentication. Not all users have a username.
 */
export type Username = string;

/**
 * Can only contain lowercase ascii letters and digits. Must start with a letter.
 */
export const $Username: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 3,
  maxLength: 64,
  pattern: /^[a-z][a-z0-9]{2,63}$/,
});

export type NullableUsername = null | Username;

export const $NullableUsername: TryUnionType<NullableUsername> = new TryUnionType({variants: [$Null, $Username]});
